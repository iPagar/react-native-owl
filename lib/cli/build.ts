import path from 'path';
import execa from 'execa';

import { CliBuildOptions, Config } from '../types';
import { Logger } from '../logger';
import { getConfig } from './config';

const ENTRY_FILE = './node_modules/react-native-owl/dist/client/index.app.js';

export const buildIOS = async (
  config: Config,
  logger: Logger
): Promise<void> => {
  const buildCommand = config.ios?.buildCommand
    ? [config.ios?.buildCommand]
    : [
        `xcodebuild`,
        `-workspace ${config.ios?.workspace}`,
        `-scheme ${config.ios?.scheme}`,
        `-configuration ${config.ios?.configuration}`,
        `-sdk iphonesimulator`,
        `-derivedDataPath ios/build`,
      ];

  if (!config.ios?.buildCommand && config.ios?.quiet) {
    buildCommand.push('-quiet');
  }

  logger.info(`[OWL - CLI] Building the app with: ${buildCommand.join(' ')}.`);

  await execa.command(buildCommand.join(' '), {
    stdio: 'inherit',
    env: {
      ENTRY_FILE,
    },
  });
};

export const buildAndroid = async (
  config: Config,
  logger: Logger
): Promise<void> => {
  const buildCommand = config.android?.buildCommand
    ? [config.android?.buildCommand]
    : [`./gradlew`, `assembleRelease`];

  if (!config.android?.buildCommand && config.android?.quiet) {
    buildCommand.push('--quiet');
  }

  const cwd = config.android?.buildCommand
    ? undefined
    : path.join(process.cwd(), '/android');

  logger.info(`[OWL - CLI] Building the app with: ${buildCommand.join(' ')}.`);

  await execa.command(buildCommand.join(' '), {
    stdio: 'inherit',
    cwd,
    env: {
      ENTRY_FILE,
    },
  });
};

export const buildHandler = async (args: CliBuildOptions) => {
  const config = await getConfig(args.config);
  const logger = new Logger(config.debug);
  const buildProject = args.platform === 'ios' ? buildIOS : buildAndroid;

  logger.print(`[OWL - CLI] Building the app on ${args.platform} platform.`);
  logger.info(`[OWL - CLI] Using the config file ${args.config}.`);

  await buildProject(config, logger);

  logger.info(
    `[OWL - CLI] Successfully built for the ${args.platform} platform.`
  );
};
