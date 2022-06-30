import { createPopper } from '@popperjs/core';
import { debounce } from 'lodash';

import { Pin, User } from './machine';
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
      src = '/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-71.svg';
      break;
    case 'MonkeDAO Twitter':
      src = '/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-73.svg';
      break;
    case 'MonkeDAO Meet-up':
    case 'Mainstream Event':
      src = '/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-50.svg';
      break;
    case 'MonkeDAO Event':
      src = '/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-53.svg';
      break;
      // src = '/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-52.svg';
      // break;
      // src = '/Monke_Nobg/310.png';
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

  const text = document.createElement('div');
  text.className = 'Map-Marker__text';
  text.innerText = pin.text;

  const date = document.createElement('div');
  date.className = 'Map-Marker__date';
  date.innerText = pin.startDate.toFormat('LLL dd, yyyy, hh:mm a');
  
  popover.appendChild(title);

  popover.appendChild(text);

  popover.appendChild(date);
  
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

type UserMarkerProps = {
  user: User;
  handleOnclick: () => void;
  handleOnmouseenter: () => void;
  handleOnmouseleave: () => void;
}

export const UserMarker = ({ user, handleOnclick, handleOnmouseenter, handleOnmouseleave }: UserMarkerProps): HTMLElement => {
  const root = document.createElement('div');
  let rootClassname = '';

  const icon = document.createElement('img');
  let src = '';
  if (user.monkeNumber && user.monkeNumber !== "") {
    src = `/Monke_No_Bg/${user.monkeNumber}.png`;
    root.className = 'Map-Marker Map-Marker--nft';
  } else {
    src = '/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-54.svg';
    root.className = 'Map-Marker';
  }
  icon.src = src;
  icon.className = 'Map-Marker__icon';
  icon.alt = 'map marker';

  root.appendChild(icon);

  root.onclick = handleOnclick;

  root.setAttribute('id', user.id);

  const popover = document.createElement('div');

  const title = document.createElement('h1');
  title.innerText = user.nickName;

  const text = document.createElement('div');
  text.className = 'Map-Marker__text';
  text.innerText = user.text;
  
  popover.appendChild(title);

  popover.appendChild(text);
  
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

type ClusterMarkerProps = {
  cluster: {
    point_count: number,
    point_count_abbreviated: number,
  },
  handleOnclick: () => void;
}

export const ClusterMarker = ({ cluster, handleOnclick }: ClusterMarkerProps): HTMLElement => {
  const root = document.createElement('div');
  
  const classnames = [
    'Map-Marker__cluster',
  ];

  if (cluster.point_count < 100) {
    classnames.push('Map-Marker__cluster--small');
  } else if (cluster.point_count >= 100 && cluster.point_count < 750) {
    classnames.push('Map-Marker__cluster--medium');
  } else {
    classnames.push('Map-Marker__cluster--large');
  }
  
  let rootClassname = classnames.join(' ');

  root.onclick = handleOnclick;

  root.className = rootClassname;
  root.innerText = `${cluster.point_count_abbreviated}`;

  return root;
}
