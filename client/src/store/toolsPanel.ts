import { atom } from 'recoil';

const toolsPanelOpen = atom<boolean>({
  key: 'toolsPanelOpen',
  default: false,
});

export default {
  toolsPanelOpen,
};
