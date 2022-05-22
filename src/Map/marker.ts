import { Pin } from './machine';
import './marker.css';

type MarkerProps = {
  pin: Pin;
  handleOnclick: () => void;
}

export const Marker = ({ pin, handleOnclick }: MarkerProps): HTMLElement => {
  const root = document.createElement('div');
  root.className = 'Map-Marker';

  const icon = document.createElement('img');
  let src = '';
  switch(pin.type) {
    case 'Event':
      src = '/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-53.svg';
      break;
    case 'Person':
      src = '/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-52.svg';
      break;
  }
  icon.src = src;
  icon.className = 'App__nav-logo';
  icon.alt = 'map marker';

  root.appendChild(icon);

  root.onclick = handleOnclick;

  root.setAttribute('id', pin.id);

  return root;
}
