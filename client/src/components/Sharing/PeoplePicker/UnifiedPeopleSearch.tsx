import React, { useState, useMemo } from 'react';
import { Mail } from 'lucide-react';
import { PrincipalType as PrincipalTypeEnum } from 'librechat-data-provider';
import type { TPrincipal, TPrincipalSearchResult, PrincipalType, PrincipalSearchParams } from 'librechat-data-provider';
import { useSearchPrincipalsQuery } from 'librechat-data-provider/react-query';
import PeoplePickerSearchItem from './PeoplePickerSearchItem';
import { SearchPicker } from './SearchPicker';
import { useLocalize } from '~/hooks';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UnifiedPeopleSearchProps {
  onAddPeople: (principals: TPrincipal[]) => void;
  placeholder?: string;
  className?: string;
  typeFilter?: Array<PrincipalType.USER | PrincipalType.GROUP | PrincipalType.ROLE> | null;
  excludeIds?: (string | undefined)[];
}

export default function UnifiedPeopleSearch({
  onAddPeople,
  placeholder,
  className = '',
  typeFilter = null,
  excludeIds = [],
}: UnifiedPeopleSearchProps) {
  const localize = useLocalize();
  const [searchQuery, setSearchQuery] = useState('');

  const searchParams: PrincipalSearchParams = useMemo(
    () => ({
      q: searchQuery,
      limit: 30,
      ...(typeFilter && typeFilter.length > 0 && { types: typeFilter }),
    }),
    [searchQuery, typeFilter],
  );

  const {
    data: searchResponse,
    isLoading: queryIsLoading,
    error,
  } = useSearchPrincipalsQuery(searchParams, {
    enabled: searchQuery.length >= 2,
  });

  const isLoading = searchQuery.length >= 2 && queryIsLoading;

  const selectableResults = useMemo(() => {
    const results = searchResponse?.results || [];

    const filtered = results.filter(
      (result) => result.idOnTheSource && !excludeIds.includes(result.idOnTheSource),
    );

    // If query looks like an email and no matching result was found, offer "add by email" option
    const trimmed = searchQuery.trim();
    if (
      EMAIL_REGEX.test(trimmed) &&
      !filtered.some((r) => r.email?.toLowerCase() === trimmed.toLowerCase()) &&
      !excludeIds.includes(trimmed)
    ) {
      filtered.push({
        type: PrincipalTypeEnum.USER,
        name: trimmed,
        email: trimmed,
        source: 'local' as const,
        idOnTheSource: trimmed,
      } as TPrincipalSearchResult);
    }

    return filtered;
  }, [searchResponse?.results, excludeIds, searchQuery]);

  if (error) {
    console.error('Principal search error:', error);
  }

  const handlePick = (principal: TPrincipal) => {
    // Immediately add the selected person to the unified list
    onAddPeople([principal]);
  };

  return (
    <div className={`${className}`}>
      <SearchPicker<TPrincipal & { key: string; value: string }>
        options={selectableResults.map((s) => ({
          ...s,
          id: s.id ?? undefined,
          key: s.idOnTheSource || 'unknown' + 'picker_key',
          value: s.idOnTheSource || 'Unknown',
        }))}
        renderOptions={(o) => {
          // Show a distinct "invite by email" item for email-only entries (no id from the server)
          if (!o.id && o.email && EMAIL_REGEX.test(o.email)) {
            return (
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Mail className="size-4 text-text-secondary" />
                <span className="text-sm text-text-primary">
                  {localize('com_ui_add_by_email', { email: o.email })}
                </span>
              </div>
            );
          }
          return <PeoplePickerSearchItem principal={o} />;
        }}
        placeholder={placeholder || localize('com_ui_search_default_placeholder')}
        query={searchQuery}
        onQueryChange={(query: string) => {
          setSearchQuery(query);
        }}
        onPick={handlePick}
        isLoading={isLoading}
        label=""
      />
    </div>
  );
}
