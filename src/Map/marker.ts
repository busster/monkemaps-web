import { createPopper } from '@popperjs/core';
import { debounce } from 'lodash';

import { Pin } from './machine';
import './marker.css';

type MarkerProps = {
  pin: Pin;
  handleOnclick: () => void;
  handleOnmouseenter: () => void;
  handleOnmouseleave: () => void;
}

export const Marker = ({ pin, handleOnclick, handleOnmouseenter, handleOnmouseleave }: MarkerProps): HTMLElement => {
  const root = document.createElement('div');
  root.className = 'Map-Marker';

  const icon = document.createElement('img');
  let src = '';
  switch(pin.type) {
    case 'MonkeDAO Discord':
    case 'Monke_Talks Podcast':
    case 'Monke Country Club':
    case 'MonkeDAO Twitter':
    case 'MonkeDAO Meet-up':
    case 'Mainstream Event':
    case 'MonkeDAO Event':
      src = '/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-53.svg';
      break;
      // src = '/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-52.svg';
      // break;
  }
  icon.src = src;
  icon.className = 'Map-Marker__icon';
  icon.alt = 'map marker';

  root.appendChild(icon);

  root.onclick = handleOnclick;

  root.setAttribute('id', pin.id);

  const popover = document.createElement('div');
  const title = document.createElement('h1');
  title.innerText = pin.name;
  
  popover.appendChild(title);
  
  popover.className = 'Marker-popover';

  root.appendChild(popover);

  createPopper(root, popover, {
    placement: 'top-start',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 10],
        },
      },
    ],
  });

  let hideTimeout: NodeJS.Timeout;
  const show = () => {
    clearTimeout(hideTimeout);
    handleOnmouseenter();
    root.classList.add('Map-Marker--visible');
    popover.classList.add('Marker-popover--visible');
  };
  const hide = () => {
    hideTimeout = setTimeout(() => {
      handleOnmouseleave();
      root.classList.remove('Map-Marker--visible');
      popover.classList.remove('Marker-popover--visible');
    }, 250)
  };

  root.onmouseenter = show;
  root.onmouseleave = hide;

  return root;
}
