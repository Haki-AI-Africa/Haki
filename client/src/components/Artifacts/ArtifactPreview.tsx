import React, { memo, useMemo, type MutableRefObject } from 'react';
import { SandpackPreview, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react/unstyled';
import type {
  SandpackProviderProps,
  SandpackPreviewRef,
} from '@codesandbox/sandpack-react/unstyled';
import type { TStartupConfig } from 'librechat-data-provider';
import type { ArtifactFiles } from '~/common';
import { sharedFiles, sharedOptions, getIndexHtml } from '~/utils/artifacts';

function TimeoutOverlay() {
  const { sandpack } = useSandpack();
  if (sandpack.status !== 'timeout') {
    return null;
  }
  return (
    <div className="sp-preview-timeout-overlay">
      <div className="sp-preview-timeout-card">
        <p className="sp-preview-timeout-title">Preview unavailable</p>
        <p className="sp-preview-timeout-body">
          The preview could not load. Please check your internet connection and try again. If the
          issue persists, contact{' '}
          <a href="mailto:support@haki.africa">support@haki.africa</a>.
        </p>
        <button onClick={() => sandpack.runSandpack()}>Try again</button>
      </div>
    </div>
  );
}

export const ArtifactPreview = memo(function ({
  files,
  fileKey,
  template,
  sharedProps,
  previewRef,
  currentCode,
  startupConfig,
  isDarkMode = false,
}: {
  files: ArtifactFiles;
  fileKey: string;
  template: SandpackProviderProps['template'];
  sharedProps: Partial<SandpackProviderProps>;
  previewRef: MutableRefObject<SandpackPreviewRef>;
  currentCode?: string;
  startupConfig?: TStartupConfig;
  isDarkMode?: boolean;
}) {
  const artifactFiles = useMemo(() => {
    if (Object.keys(files).length === 0) {
      return files;
    }
    const code = currentCode ?? '';
    if (!code) {
      return files;
    }
    return {
      ...files,
      [fileKey]: { code },
    };
  }, [currentCode, files, fileKey]);

  const options: typeof sharedOptions = useMemo(() => {
    if (!startupConfig) {
      return sharedOptions;
    }
    return {
      ...sharedOptions,
      bundlerURL: template === 'static' ? startupConfig.staticBundlerURL : startupConfig.bundlerURL,
    };
  }, [startupConfig, template]);

  if (Object.keys(artifactFiles).length === 0) {
    return null;
  }

  return (
    <SandpackProvider
      files={{ ...sharedFiles, ...artifactFiles, '/public/index.html': getIndexHtml(isDarkMode) }}
      options={options}
      {...sharedProps}
      template={template}
    >
      <SandpackPreview
        showOpenInCodeSandbox={false}
        showRefreshButton={false}
        tabIndex={0}
        ref={previewRef}
      />
      <TimeoutOverlay />
    </SandpackProvider>
  );
});
