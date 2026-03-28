/**
 * When VITE_HIDE_EXTRA_PARAMS is unset or anything other than 'false',
 * these parameters are hidden from the model settings UI:
 * maxContextTokens, maxOutputTokens, temperature, topP, topK,
 * thinking, thinkingBudget, fileTokenLimit.
 */
export const hideExtraParams = import.meta.env.VITE_HIDE_EXTRA_PARAMS !== 'false';

export const HIDDEN_PARAM_KEYS = new Set([
  'maxContextTokens',
  'maxOutputTokens',
  'temperature',
  'topP',
  'topK',
  'thinking',
  'thinkingBudget',
  'fileTokenLimit',
]);
