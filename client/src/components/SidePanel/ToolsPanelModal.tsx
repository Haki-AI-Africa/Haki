import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useRecoilState } from 'recoil';
import { useMediaQuery } from '@librechat/client';
import { getEndpointField, getConfigDefaults } from 'librechat-data-provider';
import type { TEndpointsConfig } from 'librechat-data-provider';
import { useUserKeyQuery } from 'librechat-data-provider/react-query';
import { useGetEndpointsQuery, useGetStartupConfig } from '~/data-provider';
import useSideNavLinks from '~/hooks/Nav/useSideNavLinks';
import { useSidePanelContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';
import store from '~/store';

const defaultInterface = getConfigDefaults().interface;

export default function ToolsPanelModal() {
  const localize = useLocalize();
  const isSmallScreen = useMediaQuery('(max-width: 767px)');
  const [open, setOpen] = useRecoilState(store.toolsPanelOpen);
  const [activeTab, setActiveTab] = useState<string>('');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const { endpoint } = useSidePanelContext();
  const { data: startupConfig } = useGetStartupConfig();
  const { data: endpointsConfig = {} as TEndpointsConfig } = useGetEndpointsQuery();
  const { data: keyExpiry = { expiresAt: undefined } } = useUserKeyQuery(endpoint ?? '');

  const interfaceConfig = useMemo(
    () => startupConfig?.interface ?? defaultInterface,
    [startupConfig],
  );

  const endpointType = useMemo(
    () => getEndpointField(endpointsConfig, endpoint, 'type'),
    [endpoint, endpointsConfig],
  );

  const userProvidesKey = useMemo(
    () => !!(endpointsConfig?.[endpoint ?? '']?.userProvide ?? false),
    [endpointsConfig, endpoint],
  );

  const keyProvided = useMemo(
    () => (userProvidesKey ? !!(keyExpiry.expiresAt ?? '') : true),
    [keyExpiry.expiresAt, userProvidesKey],
  );

  const links = useSideNavLinks({
    endpoint,
    hidePanel: () => {},
    keyProvided,
    endpointType,
    interfaceConfig,
    endpointsConfig,
  });

  const filteredLinks = useMemo(
    () => links.filter((link) => link.id !== 'hide-panel'),
    [links],
  );

  const currentTab = activeTab || (filteredLinks.length > 0 ? filteredLinks[0].id : '');

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const tabIds = filteredLinks.map((l) => l.id);
    const currentIndex = tabIds.indexOf(currentTab);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveTab(tabIds[(currentIndex + 1) % tabIds.length]);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveTab(tabIds[(currentIndex - 1 + tabIds.length) % tabIds.length]);
        break;
      case 'Home':
        event.preventDefault();
        setActiveTab(tabIds[0]);
        break;
      case 'End':
        event.preventDefault();
        setActiveTab(tabIds[tabIds.length - 1]);
        break;
    }
  };

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        setOpen(false);
      }
    },
    [setOpen],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, setOpen]);

  if (!open) {
    return null;
  }

  return (
    <div className="relative z-50">
      <div
        className="fixed inset-0 bg-black opacity-50 dark:opacity-80"
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 flex w-screen items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'max-h-[90vh] overflow-hidden rounded-xl rounded-b-lg bg-background pb-6 shadow-2xl backdrop-blur-2xl animate-in sm:rounded-2xl md:w-[800px]',
          )}
        >
          <div className="mb-1 flex items-center justify-between p-6 pb-5 text-left">
            <h2 className="text-lg font-medium leading-6 text-text-primary">
              {localize('com_ui_controls')}
            </h2>
            <button
              type="button"
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-border-xheavy focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-surface-primary dark:focus:ring-offset-surface-primary"
              onClick={() => setOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-text-primary"
              >
                <line x1="18" x2="6" y1="6" y2="18"></line>
                <line x1="6" x2="18" y1="6" y2="18"></line>
              </svg>
              <span className="sr-only">{localize('com_ui_close')}</span>
            </button>
          </div>
          <div className="max-h-[calc(90vh-120px)] overflow-auto px-6 md:w-[800px]">
            <Tabs.Root
              value={currentTab}
              onValueChange={setActiveTab}
              className="flex flex-col gap-10 md:flex-row"
              orientation="vertical"
            >
              <Tabs.List
                aria-label="Tools Panel"
                className={cn(
                  'min-w-auto max-w-auto relative -ml-[8px] flex flex-shrink-0 flex-col flex-nowrap overflow-auto sm:max-w-none',
                  isSmallScreen
                    ? 'flex-row rounded-xl bg-surface-secondary'
                    : 'sticky top-0 h-full',
                )}
                onKeyDown={handleKeyDown}
              >
                {filteredLinks.map((link) => (
                  <Tabs.Trigger
                    key={link.id}
                    className={cn(
                      'group relative z-10 m-1 flex items-center justify-start gap-2 rounded-xl px-2 py-1.5 transition-all duration-200 ease-in-out',
                      isSmallScreen
                        ? 'flex-1 justify-center text-nowrap p-1 px-3 text-sm text-text-secondary radix-state-active:bg-surface-hover radix-state-active:text-text-primary'
                        : 'bg-transparent text-text-secondary radix-state-active:bg-surface-tertiary radix-state-active:text-text-primary',
                    )}
                    value={link.id}
                    ref={(el) => (tabRefs.current[link.id] = el)}
                  >
                    <link.icon className="icon-sm" aria-hidden="true" />
                    {localize(link.title)}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
              <div className="overflow-auto sm:w-full sm:max-w-none md:pr-0.5 md:pt-0.5">
                {filteredLinks.map(
                  (link) =>
                    link.Component && (
                      <Tabs.Content key={link.id} value={link.id} tabIndex={-1}>
                        <link.Component />
                      </Tabs.Content>
                    ),
                )}
              </div>
            </Tabs.Root>
          </div>
        </div>
      </div>
    </div>
  );
}
