import path from 'path';
import { homedir } from 'os';
import execa, { ExecaReturnValue } from 'execa';

import { CliRunOptions, Config } from '../types';
import { Logger } from '../logger';
import * as configHelpers from './config';
import * as run from './run';
import * as reportHelpers from '../report';
import * as websocketHelpers from '../websocket';

describe('run.ts', () => {
  const logger = new Logger();
  const bundleIdIOS = 'org.reactjs.native.example.RNDemo';
  const mockBundleIdResponse = { stdout: bundleIdIOS } as ExecaReturnValue<any>;
  const mockStartWebSocketServer = jest
    .spyOn(websocketHelpers, 'startWebSocketServer')
    .mockResolvedValue(undefined!);

  describe('runOS', () => {
    const execMock = jest.spyOn(execa, 'command').mockImplementation();
    let spyDetIOSFrameworkPath: jest.SpyInstance;

    beforeEach(() => {
      execMock.mockReset();

      spyDetIOSFrameworkPath = jest
        .spyOn(run, 'getIOSFrameworkPath')
        .mockResolvedValue('frameworkPath');
    });

    afterEach(() => {
      spyDetIOSFrameworkPath.mockRestore();
    });

    it('runs an iOS project - with the default build command', async () => {
      const cwd = path.join(
        process.cwd(),
        '/ios/build/Build/Products/Debug-iphonesimulator'
      );
      const plistPath = path.join(cwd, 'RNDemo.app', 'Info.plist');

      execMock.mockResolvedValueOnce(mockBundleIdResponse);

      const config: Config = {
        ios: {
          workspace: 'ios/RNDemo.xcworkspace',
          scheme: 'RNDemo',
          configuration: 'Debug',
          device: 'iPhone Simulator',
        },
      };

      await run.runIOS(config, logger);

      expect(execMock).toHaveBeenNthCalledWith(
        1,
        `./PlistBuddy -c 'Print CFBundleIdentifier' ${plistPath}`,
        { cwd: '/usr/libexec', shell: true }
      );

      expect(execMock).toHaveBeenNthCalledWith(
        2,
        'xcrun simctl status_bar iPhone\\ Simulator override --time 9:41 --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularMode active --cellularBars 4',
        { cwd, stdio: 'ignore' }
      );

      expect(execMock).toHaveBeenNthCalledWith(
        3,
        'xcrun simctl install iPhone\\ Simulator RNDemo.app',
        { cwd, stdio: 'ignore' }
      );

      expect(execMock).toHaveBeenNthCalledWith(
        4,
        `SIMCTL_CHILD_DYLD_INSERT_LIBRARIES=\"frameworkPath/OwlClient\" xcrun simctl launch \"iPhone\\ Simulator\" ${bundleIdIOS}`,
        { cwd, shell: true, stdio: 'ignore' }
      );
    });

    it('runs an iOS project - with a custom build command and binaryPath', async () => {
      const binaryPath = 'custom/path/RNDemo.app';
      const cwd = path.dirname(binaryPath);

      execMock.mockResolvedValueOnce(mockBundleIdResponse);

      const config: Config = {
        ios: {
          buildCommand: "echo 'Hello World'",
          binaryPath,
          device: 'iPhone Simulator',
        },
      };

      await run.runIOS(config, logger);

      expect(execMock).toHaveBeenNthCalledWith(
        1,
        `./PlistBuddy -c 'Print CFBundleIdentifier' ${binaryPath}/Info.plist`,
        { cwd: '/usr/libexec', shell: true }
      );

      expect(execMock).toHaveBeenNthCalledWith(
        2,
        'xcrun simctl status_bar iPhone\\ Simulator override --time 9:41 --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularMode active --cellularBars 4',
        { cwd, stdio: 'ignore' }
      );

      expect(execMock).toHaveBeenNthCalledWith(
        3,
        'xcrun simctl install iPhone\\ Simulator RNDemo.app',
        { cwd, stdio: 'ignore' }
      );

      expect(execMock).toHaveBeenNthCalledWith(
        4,
        `SIMCTL_CHILD_DYLD_INSERT_LIBRARIES=\"frameworkPath/OwlClient\" xcrun simctl launch \"iPhone\\ Simulator\" ${bundleIdIOS}`,
        { cwd, shell: true, stdio: 'ignore' }
      );
    });
  });

  describe('runAndroid', () => {
    const cwd = path.join(
      process.cwd(),
      '/android/app/build/outputs/apk/debug'
    );

    const execMock = jest.spyOn(execa, 'command').mockImplementation();

    beforeEach(() => {
      execMock.mockReset();
    });

    it('runs an Android project - with the default build command', async () => {
      const appPath = path.join(cwd, 'app-debug.apk');

      const config: Config = {
        android: {
          packageName: 'com.rndemo',
        },
      };

      await run.runAndroid(config, logger);

      expect(execMock).toHaveBeenNthCalledWith(
        1,
        `adb shell settings put global sysui_demo_allowed 1`,
        {
          stdio: 'ignore',
        }
      );

      expect(execMock).toHaveBeenNthCalledWith(
        2,
        `adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0941`,
        {
          stdio: 'ignore',
        }
      );

      expect(execMock).toHaveBeenNthCalledWith(
        3,
        `adb shell am broadcast -a com.android.systemui.demo -e command network -e mobile show -e level 4 -e datatype 4g -e wifi false`,
        {
          stdio: 'ignore',
        }
      );

      expect(execMock).toHaveBeenNthCalledWith(
        4,
        `adb shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false`,
        {
          stdio: 'ignore',
        }
      );

      expect(execMock).toHaveBeenNthCalledWith(
        5,
        `adb shell am broadcast -a com.android.systemui.demo -e command battery -e plugged false -e level 100`,
        {
          stdio: 'ignore',
        }
      );

      expect(execMock).toHaveBeenNthCalledWith(6, `adb install -r ${appPath}`, {
        stdio: 'ignore',
      });

      expect(execMock).toHaveBeenNthCalledWith(
        7,
        `adb shell monkey -p \"com.rndemo\" -c android.intent.category.LAUNCHER 1`,
        { stdio: 'ignore' }
      );
    });

    it('runs an Android project - with a custom build command', async () => {
      const binaryPath = '/Users/Demo/Desktop/app-debug.apk';

      const config: Config = {
        android: {
          packageName: 'com.rndemo',
          buildCommand: './gradlew example',
          binaryPath,
        },
      };

      await run.runAndroid(config, logger);

      expect(execMock).toHaveBeenNthCalledWith(
        6,
        `adb install -r ${binaryPath}`,
        {
          stdio: 'ignore',
        }
      );

      expect(execMock).toHaveBeenNthCalledWith(
        7,
        `adb shell monkey -p \"com.rndemo\" -c android.intent.category.LAUNCHER 1`,
        { stdio: 'ignore' }
      );
    });
  });

  describe('runHandler', () => {
    const args = {
      platform: 'ios',
      config: './owl.config.json',
      update: false,
    } as CliRunOptions;

    const config: Config = {
      ios: {
        workspace: 'ios/RNDemo.xcworkspace',
        scheme: 'RNDemo',
        device: 'iPhone Simulator',
      },
      android: {
        packageName: 'com.rndemo',
        buildCommand: "echo 'Hello World'",
      },
    };

    const expectedJestCommand = `jest --config=${path.join(
      process.cwd(),
      'lib',
      'jest-config.json'
    )} --roots=${path.join(process.cwd())} --runInBand`;

    const commandSyncMock = jest.spyOn(execa, 'commandSync');
    const mockGenerateReport = jest.spyOn(reportHelpers, 'generateReport');

    jest.spyOn(Logger.prototype, 'print').mockImplementation();

    beforeEach(() => {
      commandSyncMock.mockReset();
      mockGenerateReport.mockReset();
      mockStartWebSocketServer.mockReset();
    });

    it('runs an iOS project', async () => {
      jest.spyOn(configHelpers, 'getConfig').mockResolvedValueOnce(config);
      const mockRunIOS = jest.spyOn(run, 'runIOS').mockResolvedValueOnce();

      await run.runHandler(args);

      await expect(mockRunIOS).toHaveBeenCalled();
      await expect(commandSyncMock).toHaveBeenCalledTimes(1);
      await expect(commandSyncMock).toHaveBeenCalledWith(expectedJestCommand, {
        env: {
          OWL_DEBUG: 'false',
          OWL_PLATFORM: 'ios',
          OWL_UPDATE_BASELINE: 'false',
        },
        stdio: 'inherit',
      });
    });

    it('runs an Android project', async () => {
      jest.spyOn(configHelpers, 'getConfig').mockResolvedValueOnce(config);
      const mockRunAndroid = jest
        .spyOn(run, 'runAndroid')
        .mockResolvedValueOnce();

      await run.runHandler({ ...args, platform: 'android' });

      await expect(mockRunAndroid).toHaveBeenCalled();
      await expect(commandSyncMock).toHaveBeenCalledTimes(1);
      await expect(commandSyncMock).toHaveBeenCalledWith(expectedJestCommand, {
        env: {
          OWL_DEBUG: 'false',
          OWL_PLATFORM: 'android',
          OWL_UPDATE_BASELINE: 'false',
        },
        stdio: 'inherit',
      });
    });

    it('runs with the update baseline flag on', async () => {
      jest.spyOn(configHelpers, 'getConfig').mockResolvedValueOnce(config);
      const mockRunIOS = jest.spyOn(run, 'runIOS').mockResolvedValueOnce();

      await run.runHandler({ ...args, update: true });

      await expect(mockRunIOS).toHaveBeenCalled();
      await expect(commandSyncMock).toHaveBeenCalledTimes(1);
      await expect(commandSyncMock).toHaveBeenCalledWith(expectedJestCommand, {
        env: {
          OWL_DEBUG: 'false',
          OWL_PLATFORM: 'ios',
          OWL_UPDATE_BASELINE: 'true',
        },
        stdio: 'inherit',
      });
    });

    it('runs the createWebSocketServer helper', async () => {
      jest.spyOn(configHelpers, 'getConfig').mockResolvedValueOnce(config);

      const mockRunIOS = jest.spyOn(run, 'runIOS').mockResolvedValueOnce();

      await run.runHandler({ ...args });

      await expect(mockRunIOS).toHaveBeenCalled();
      await expect(mockStartWebSocketServer).toHaveBeenCalledTimes(1);
    });

    it('runs generates the report if the config is set to on', async () => {
      const caseConfig: Config = {
        ...config,
        report: true,
      };

      jest.spyOn(configHelpers, 'getConfig').mockResolvedValueOnce(caseConfig);
      const mockRunIOS = jest.spyOn(run, 'runIOS').mockResolvedValueOnce();

      commandSyncMock.mockRejectedValueOnce(undefined!);

      try {
        await run.runHandler({ ...args, update: true });
      } catch {
        await expect(mockRunIOS).toHaveBeenCalled();
        await expect(commandSyncMock).toHaveBeenCalledTimes(1);
        await expect(mockGenerateReport).toHaveBeenCalledTimes(1);
      }
    });

    it('does not generate the report if the config is set to off', async () => {
      const caseConfig: Config = {
        ...config,
        report: false,
      };

      jest.spyOn(configHelpers, 'getConfig').mockResolvedValueOnce(caseConfig);
      const mockRunIOS = jest.spyOn(run, 'runIOS').mockResolvedValueOnce();

      commandSyncMock.mockRejectedValueOnce(undefined!);

      try {
        await run.runHandler({ ...args, update: true });
      } catch {
        await expect(mockRunIOS).toHaveBeenCalled();
        await expect(commandSyncMock).toHaveBeenCalledTimes(1);
        await expect(mockGenerateReport).not.toHaveBeenCalled();
      }
    });

    it('does not generate the report if the tests pass', async () => {
      const caseConfig: Config = {
        ...config,
        report: true,
      };

      jest.spyOn(configHelpers, 'getConfig').mockResolvedValueOnce(caseConfig);
      const mockRunIOS = jest.spyOn(run, 'runIOS').mockResolvedValueOnce();

      await run.runHandler({ ...args, update: true });

      await expect(mockRunIOS).toHaveBeenCalled();
      await expect(commandSyncMock).toHaveBeenCalledTimes(1);
      await expect(mockGenerateReport).not.toHaveBeenCalled();
    });
  });

  describe('getIOSFrameworkPath', () => {
    const execMock = jest.spyOn(execa, 'command').mockImplementation();
    const mockSha1Response = {
      stdout: 'hash',
    } as ExecaReturnValue<any>;

    beforeEach(() => {
      execMock.mockReset();
    });

    it('gets the framework path', async () => {
      const owlClientVersion = require(path.join(
        __dirname,
        '../../package.json'
      )).version;

      execMock.mockResolvedValueOnce(mockSha1Response);

      const frameworkPath = await run.getIOSFrameworkPath({
        cwd: '/usr/libexec',
        stdio: 'ignore',
      });

      expect(execMock).toHaveBeenNthCalledWith(
        1,
        `(echo "${owlClientVersion}" && xcodebuild -version) | shasum | awk '{print $1}'`,
        { cwd: '/usr/libexec', stdio: 'ignore' }
      );

      expect(frameworkPath).toEqual(
        `${homedir()}/Library/OwlClient/ios/hash/OwlClient.framework`
      );
    });
  });
});
