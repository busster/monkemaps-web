import React, { useEffect, useMemo, useRef, useState } from 'react'

import { customAlphabet } from 'nanoid'

import './index.css'
import { assign, createMachine } from 'xstate'
import { useMachine } from '@xstate/react'
import { debounce } from 'lodash'
import { createPopper } from '@popperjs/core'
import { useClickOutside } from '../../utils/clickOutside'

const nanoid = customAlphabet(
  '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  20,
)

type SearchContext = {
  onSearch: (searchTerm: string) => Promise<any[]>
  onSelect: (value: any) => void
  mapTextValue: (value: any) => string
  results: any[]
  searchTerm: string
  value?: any
}
type SearchEvents =
  | { type: 'SEARCH'; searchTerm: string }
  | { type: 'SELECT'; value: any }
  | { type: 'RESELECT'; value: any }
  | { type: 'ESCAPE' }
  | { type: 'FOCUS' }
const createDropdownSearchMachine = (props: SearchContext) =>
  createMachine<SearchContext, SearchEvents>(
    {
      id: 'dropdown-search',

      context: props,

      initial: 'idle',

      states: {
        idle: {
          on: {
            SEARCH: {
              target: 'searching',
              actions: ['setSearchTerm'],
            },
            FOCUS: [
              {
                target: 'results',
                cond: 'hasSearchTerm',
              },
              {
                target: 'typing',
              },
            ],
          },
        },
        typing: {
          on: {
            SEARCH: {
              target: 'searching',
              actions: ['setSearchTerm'],
            },
          },
        },
        searching: {
          invoke: {
            src: (context, event) => props.onSearch(context.searchTerm),
            onDone: {
              target: 'results',
              actions: ['setResults'],
            },
            onError: 'idle',
          },
          on: {
            SEARCH: {
              target: 'searching',
              actions: ['setSearchTerm'],
            },
          },
        },
        results: {
          on: {
            SEARCH: {
              target: 'searching',
              actions: ['setSearchTerm'],
            },
            SELECT: {
              target: 'idle',
              actions: ['setSelectedResult', 'handleSelectResult'],
            },
          },
        },
      },
      on: {
        ESCAPE: 'idle',
        RESELECT: {
          actions: ['setSelectedResult'],
        },
      },
    },
    {
      actions: {
        setSearchTerm: assign({
          searchTerm: (context, event) => (event as any).searchTerm,
        }),
        setResults: assign({
          results: (context, event) => (event as any).data,
        }),
        setSelectedResult: assign({
          value: (context, event) => (event as any).value,
        }),
        handleSelectResult: (context, event) =>
          props.onSelect((event as any).value),
      },
      guards: {
        hasSearchTerm: (context, event) => context.searchTerm.length > 0,
      },
    },
  )

type MDDropdownSearchProps = {
  id?: string
  label?: string
  placeholder?: string
  selectedValue?: any
  mapTextValue: (value: any) => string
  selectId?: (value: any) => string
  onSearch: (searchTerm: string) => Promise<any[]>
  onSelect: (value: any) => void
  results?: any[]
  readonly?: boolean
  disabled?: boolean
}

export const MDDropdownSearch = (props: MDDropdownSearchProps) => {
  const rootRef = useRef(null)
  const popoverRef = useRef(null)

  const {
    id,
    label,
    placeholder,
    selectedValue,
    mapTextValue,
    selectId,
    onSearch,
    onSelect,
    results,
    readonly,
    disabled,
  } = props

  const getId = (result: any) =>
    selectId && result ? selectId(result) : nanoid()
  const isSelected = (result: any) => {
    const yes = getId(result) === getId(selectedValue)
    return yes
  }

  const [state, send] = useMachine(() =>
    createDropdownSearchMachine({
      onSearch,
      onSelect,
      searchTerm: '',
      mapTextValue,
      value: selectedValue,
      results: results || [],
    }),
  )
  useEffect(() => {
    // Used to trigger a clear if selectedValue is set from outside the component
    send({ type: 'RESELECT', value: selectedValue })
  }, [mapTextValue(selectedValue)])

  useClickOutside(rootRef, () => send('ESCAPE'))

  const inputId = id || nanoid()

  const handleSearch = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    send('SEARCH', { searchTerm: e.target.value })
  }, 500)

  useEffect(() => {
    if (rootRef.current && popoverRef.current) {
      createPopper(rootRef.current, popoverRef.current, {
        placement: 'bottom-start',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 5],
            },
          },
          {
            name: 'sameWidth',
            enabled: true,
            phase: 'beforeWrite',
            requires: ['computeStyles'],
            fn: ({ state }) => {
              state.styles.popper.width = `${state.rects.reference.width}px`
            },
            effect: ({ state }) => {
              state.elements.popper.style.width = `${
                state.elements.reference.getBoundingClientRect().width
              }px`
            },
          },
        ],
      })
    }
  }, [rootRef, popoverRef])

  return (
    <div ref={rootRef} className="md-dropdown-search__container">
      {label && (
        <label className="md-dropdown-search__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      {state.matches('idle') ? (
        <input
          id={inputId + 'idle'}
          key={mapTextValue(state.context.value)}
          placeholder={placeholder}
          className="md-dropdown-search"
          defaultValue={mapTextValue(state.context.value)}
          onClick={() => send('FOCUS')}
          disabled={readonly || disabled}
        ></input>
      ) : (
        <input
          id={inputId}
          key={mapTextValue(state.context.value)}
          placeholder={placeholder}
          className="md-dropdown-search"
          defaultValue={mapTextValue(state.context.value)}
          onChange={handleSearch}
          autoFocus={true}
          disabled={readonly || disabled}
        ></input>
      )}
      <div
        ref={popoverRef}
        className={`md-dropdown-search__results ${
          ['results', 'searching'].some(state.matches)
            ? 'md-dropdown-search__results--show'
            : ''
        }`}
      >
        {state.context.results.length > 0 ? (
          state.context.results.map((result) => (
            <div
              onClick={() => send('SELECT', { value: result })}
              key={getId(result)}
              className={`md-dropdown-search__results-item ${
                isSelected(result)
                  ? 'md-dropdown-search__results-item--selected'
                  : ''
              }`}
            >
              {mapTextValue(result)}
            </div>
          ))
        ) : (
          <div className="md-dropdown-search__results--none">
            {state.matches('searching') ? 'Loading' : 'No results.'}
          </div>
        )}
      </div>
    </div>
  )
}
