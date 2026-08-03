import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const at = (...parts) => path.join(root, ...parts);
const read = (...parts) => fs.readFile(at(...parts), 'utf8');
const exists = async (...parts) => fs.access(at(...parts)).then(() => true, () => false);
const assert = (condition, message) => { if (!condition) throw new Error(`iOS verification failed: ${message}`); };
const includes = (text, fragment, message) => assert(text.includes(fragment), message);

function pngInfo(buffer) {
  assert(buffer.length >= 33 && buffer.subarray(1, 4).toString() === 'PNG', 'icon must be a valid PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer[25],
  };
}

async function filesUnder(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const item = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(item) : [item];
  }));
  return nested.flat();
}

const required = [
  '.github/workflows/pages.yml',
  'capacitor.config.json',
  'ios/App/App.xcodeproj/project.pbxproj',
  'ios/App/App/Info.plist',
  'ios/App/App/PrivacyInfo.xcprivacy',
  'ios/App/CapApp-SPM/Package.swift',
  'ios/App/App/public/index.html',
  'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png',
  'ios/App/App/Base.lproj/LaunchScreen.storyboard',
  'public/privacy.html',
  'public/support.html',
  'docs/app-store/metadata.md',
];
for (const file of required) assert(await exists(file), `${file} is missing`);

const config = JSON.parse(await read('capacitor.config.json'));
assert(config.appId === 'io.nacka.dockwise', 'Capacitor appId must be io.nacka.dockwise');
assert(config.appName === 'Dockwise', 'Capacitor appName must be Dockwise');
assert(config.webDir === 'dist', 'Capacitor webDir must be dist');
assert(!Object.hasOwn(config, 'server'), 'Capacitor config must not define a remote server');

const nativeConfig = JSON.parse(await read('ios/App/App/capacitor.config.json'));
assert(nativeConfig.appId === config.appId && nativeConfig.appName === config.appName, 'copied native config must match app identity');
assert(!Object.hasOwn(nativeConfig, 'server'), 'native Capacitor config must not define a remote server');

const project = await read('ios/App/App.xcodeproj/project.pbxproj');
for (const value of [
  'PRODUCT_BUNDLE_IDENTIFIER = io.nacka.dockwise;',
  'MARKETING_VERSION = 1.0.0;',
  'CURRENT_PROJECT_VERSION = 1;',
  'TARGETED_DEVICE_FAMILY = "1,2";',
  'IPHONEOS_DEPLOYMENT_TARGET = 15.0;',
  'PrivacyInfo.xcprivacy in Resources',
]) includes(project, value, `Xcode project must include ${value}`);
assert(!/DEVELOPMENT_TEAM\s*=/.test(project), 'project must not set a development team');
assert(!/(\/Users\/|\.mobileprovision|PROVISIONING_PROFILE_SPECIFIER)/.test(project), 'project must not contain user-specific paths or signing profiles');

const swiftPackage = await read('ios/App/CapApp-SPM/Package.swift');
includes(swiftPackage, 'platforms: [.iOS(.v15)]', 'Capacitor package-supported iOS minimum must be 15');
includes(swiftPackage, 'CapacitorHaptics', 'Haptics plugin must be linked');
includes(swiftPackage, 'CapacitorPreferences', 'Preferences plugin must be linked');

const info = await read('ios/App/App/Info.plist');
includes(info, '<key>CFBundleDisplayName</key>', 'Info.plist must define a display name');
includes(info, '<string>Dockwise</string>', 'display name must be Dockwise');
includes(info, '<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>', 'export compliance must declare no non-exempt encryption');
for (const orientation of [
  'UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown',
  'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight',
]) includes(info, orientation, `Info.plist must support ${orientation}`);
assert(!/NS(?:Camera|Microphone|Location|Photo|Contacts|Bluetooth).*UsageDescription/.test(info), 'unused protected-API descriptions must not be present');

const privacy = await read('ios/App/App/PrivacyInfo.xcprivacy');
includes(privacy, '<key>NSPrivacyTracking</key>\n\t<false/>', 'privacy manifest must disable tracking');
includes(privacy, '<key>NSPrivacyCollectedDataTypes</key>\n\t<array/>', 'privacy manifest must declare no collected data');
includes(privacy, 'NSPrivacyAccessedAPICategoryUserDefaults', 'privacy manifest must declare UserDefaults');
includes(privacy, '<string>CA92.1</string>', 'UserDefaults approved reason must be CA92.1');

const sourceIcon = await fs.readFile(at('assets/app-icon-1024.png'));
const targetIcon = await fs.readFile(at('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'));
for (const [name, buffer] of [['source', sourceIcon], ['iOS', targetIcon]]) {
  const icon = pngInfo(buffer);
  assert(icon.width === 1024 && icon.height === 1024, `${name} icon must be 1024x1024`);
  assert(![4, 6].includes(icon.colorType), `${name} icon must be opaque (no alpha channel)`);
}
assert(crypto.createHash('sha256').update(sourceIcon).digest('hex') === crypto.createHash('sha256').update(targetIcon).digest('hex'), 'source and iOS app icons must match');

const launch = await read('ios/App/App/Base.lproj/LaunchScreen.storyboard');
includes(launch, 'image="Splash"', 'launch screen must use branded Splash assets');
for (const splash of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  const image = pngInfo(await fs.readFile(at('ios/App/App/Assets.xcassets/Splash.imageset', splash)));
  assert(image.width === 2732 && image.height === 2732 && ![4, 6].includes(image.colorType), `${splash} must be an opaque 2732 square`);
}

assert(await exists('dist/index.html'), 'dist must exist; run npm run build first');
const distFiles = await filesUnder(at('dist'));
for (const source of distFiles) {
  const relative = path.relative(at('dist'), source);
  const target = at('ios/App/App/public', relative);
  assert(await exists('ios/App/App/public', relative), `built asset ${relative} was not copied into iOS public`);
  const [a, b] = await Promise.all([fs.readFile(source), fs.readFile(target)]);
  assert(a.equals(b), `iOS built asset ${relative} is stale`);
}
const nativeHtml = await read('ios/App/App/public/index.html');
assert(!/<script[^>]+src=["']https?:\/\//i.test(nativeHtml), 'iOS index must not load remote scripts');
includes(nativeHtml, 'viewport-fit=cover', 'copied web app must enable safe-area viewport fitting');

for (const page of ['privacy.html', 'support.html']) {
  const source = await read('public', page);
  const built = await read('dist', page);
  const copied = await read('ios/App/App/public', page);
  assert(source === built && built === copied, `${page} must be built and copied unchanged`);
  includes(source, 'mattias@nacka.io', `${page} must include support contact`);
}
const privacyPage = await read('public/privacy.html');
for (const statement of ['does not require an account', 'does not collect', 'stored locally on your device']) {
  includes(privacyPage, statement, `privacy page must state: ${statement}`);
}
const supportPage = await read('public/support.html');
includes(supportPage, 'qualitative training simulator', 'support page must include qualitative training disclaimer');
const metadata = await read('docs/app-store/metadata.md');
for (const item of [
  'Education (primary), Utilities (secondary)',
  '© 2026 Mattias Johansson',
  'https://matt1as.github.io/dockwise/support.html',
  'https://matt1as.github.io/dockwise/privacy.html',
  'TestFlight beta description',
  'What to Test',
  'App Review notes',
  'App Privacy answers',
  'one-time $4.99',
]) {
  includes(metadata, item, `App Store metadata must include ${item}`);
}
assert(!/uploaded|released/i.test(metadata.split('\n')[0]), 'metadata heading must not claim upload or release');

console.log(JSON.stringify({
  status: 'PASS',
  appId: config.appId,
  version: '1.0.0 (1)',
  deploymentTarget: 'iOS 15.0',
  copiedWebFiles: distFiles.length,
  icon: '1024x1024 opaque',
  privacyReason: 'CA92.1',
  signingTeam: 'unset',
}, null, 2));
