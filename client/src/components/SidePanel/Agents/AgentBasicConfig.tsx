import React from 'react';
import { Controller, useWatch, useFormContext } from 'react-hook-form';
import { getEndpointField } from 'librechat-data-provider';
import type { AgentForm, IconComponentTypes } from '~/common';
import { removeFocusOutlines, defaultTextProps, getIconKey, cn } from '~/utils';
import { useAgentPanelContext } from '~/Providers';
import AgentCategorySelector from './AgentCategorySelector';
import { icons } from '~/hooks/Endpoint/Icons';
import { useLocalize } from '~/hooks';
import Instructions from './Instructions';
import AgentAvatar from './AgentAvatar';
import { Panel } from '~/common';

const labelClass = 'mb-2 text-token-text-primary block font-medium';
const inputClass = cn(
  defaultTextProps,
  'flex w-full px-3 py-2 border-border-light bg-surface-secondary focus-visible:ring-2 focus-visible:ring-ring-primary',
  removeFocusOutlines,
);

export default function AgentBasicConfig() {
  const localize = useLocalize();
  const methods = useFormContext<AgentForm>();
  const { setActivePanel, endpointsConfig } = useAgentPanelContext();

  const {
    control,
    formState: { errors },
  } = methods;
  const provider = useWatch({ control, name: 'provider' });
  const model = useWatch({ control, name: 'model' });
  const agent = useWatch({ control, name: 'agent' });

  const providerValue = typeof provider === 'string' ? provider : provider?.value;
  let Icon: IconComponentTypes | null | undefined;
  let endpointType: string | undefined;
  let endpointIconURL: string | undefined;
  let iconKey: string | undefined;

  if (providerValue !== undefined) {
    endpointType = getEndpointField(endpointsConfig, providerValue as string, 'type');
    endpointIconURL = getEndpointField(endpointsConfig, providerValue as string, 'iconURL');
    iconKey = getIconKey({
      endpoint: providerValue as string,
      endpointsConfig,
      endpointType,
      endpointIconURL,
    });
    Icon = icons[iconKey];
  }

  return (
    <div className="h-auto bg-white px-4 pt-3 dark:bg-transparent">
      {/* Avatar & Name */}
      <div className="mb-4">
        <AgentAvatar avatar={agent?.['avatar'] ?? null} />
        <label className={labelClass} htmlFor="name">
          {localize('com_ui_name')}
          <span className="text-red-500">*</span>
        </label>
        <Controller
          name="name"
          rules={{ required: localize('com_ui_agent_name_is_required') }}
          control={control}
          render={({ field }) => (
            <>
              <input
                {...field}
                value={field.value ?? ''}
                maxLength={256}
                className={inputClass}
                id="name"
                type="text"
                placeholder={localize('com_agents_name_placeholder')}
                aria-label="Agent name"
              />
              <div
                className={cn(
                  'mt-1 w-56 text-sm text-red-500',
                  errors.name ? 'visible h-auto' : 'invisible h-0',
                )}
                role="alert"
              >
                {errors.name ? errors.name.message : ' '}
              </div>
            </>
          )}
        />
      </div>
      {/* Description */}
      <div className="mb-4">
        <label className={labelClass} htmlFor="description">
          {localize('com_ui_description')}
        </label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              value={field.value ?? ''}
              maxLength={512}
              className={inputClass}
              id="description"
              type="text"
              placeholder={localize('com_agents_description_placeholder')}
              aria-label="Agent description"
            />
          )}
        />
      </div>
      {/* Category */}
      <div className="mb-4">
        <label className={labelClass} htmlFor="category-selector">
          {localize('com_ui_category')} <span className="text-red-500">*</span>
        </label>
        <AgentCategorySelector className="w-full" />
      </div>
      {/* Instructions */}
      <Instructions />
      {/* Model and Provider */}
      <div className="mb-4">
        <label className={labelClass} htmlFor="provider">
          {localize('com_ui_model')} <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => setActivePanel(Panel.model)}
          className="btn btn-neutral border-token-border-light relative h-10 w-full rounded-lg font-medium"
          aria-haspopup="true"
          aria-expanded="false"
        >
          <div className="flex w-full items-center gap-2">
            {Icon && (
              <div className="shadow-stroke relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white text-black dark:bg-white">
                <Icon
                  className="h-2/3 w-2/3"
                  endpoint={providerValue as string}
                  endpointType={endpointType}
                  iconURL={endpointIconURL}
                />
              </div>
            )}
            <span>{model != null && model ? model : localize('com_ui_select_model')}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
