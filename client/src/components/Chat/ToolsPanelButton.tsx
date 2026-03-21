import { useSetRecoilState } from 'recoil';
import { TooltipAnchor } from '@librechat/client';
import { Settings2 } from 'lucide-react';
import { useLocalize } from '~/hooks';
import store from '~/store';

export default function ToolsPanelButton() {
  const localize = useLocalize();
  const setToolsPanelOpen = useSetRecoilState(store.toolsPanelOpen);

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <TooltipAnchor
        description={localize('com_ui_controls')}
        render={
          <button
            onClick={() => setToolsPanelOpen(true)}
            aria-label={localize('com_ui_controls')}
            className="inline-flex size-10 flex-shrink-0 items-center justify-center rounded-xl border border-border-light bg-presentation text-text-primary shadow-sm transition-all ease-in-out hover:bg-surface-active-alt"
          >
            <Settings2 className="icon-lg" aria-hidden="true" />
          </button>
        }
      />
    </div>
  );
}
