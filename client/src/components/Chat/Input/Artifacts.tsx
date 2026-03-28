import { memo, useCallback, useMemo } from 'react';
import { CheckboxButton } from '@librechat/client';
import { ArtifactModes } from 'librechat-data-provider';
import { WandSparkles } from 'lucide-react';
import { useBadgeRowContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

function Artifacts() {
  const localize = useLocalize();
  const { artifacts } = useBadgeRowContext();
  const { toggleState, debouncedChange, isPinned } = artifacts;

  const isEnabled = useMemo(() => typeof toggleState === 'string' && toggleState !== '', [toggleState]);

  const handleToggle = useCallback(() => {
    if (isEnabled) {
      debouncedChange({ value: '' });
    } else {
      debouncedChange({ value: ArtifactModes.SHADCNUI });
    }
  }, [isEnabled, debouncedChange]);

  if (!isEnabled && !isPinned) {
    return null;
  }

  return (
    <CheckboxButton
      className={cn('max-w-fit')}
      checked={isEnabled}
      setValue={handleToggle}
      label={localize('com_ui_artifacts')}
      isCheckedClassName="border-amber-600/40 bg-amber-500/10 hover:bg-amber-700/10"
      icon={<WandSparkles className="icon-md" aria-hidden="true" />}
    />
  );
}

export default memo(Artifacts);
