import React from 'react'

import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useActor } from '@xstate/react'

import './locationDetails.css'

import { mapService } from './machine'

const useLocationDetails = () => {
  const navigate = useNavigate()

  const [state] = useActor(mapService)

  const a = useLocation()
  const idMatch = a.pathname.match(/\/map\/(.*)/)
  const id = idMatch && idMatch.length > 1 && idMatch[1]

  const location = state.context.pins.find((pin) => pin.id === id)

  if (!location) {
    navigate('/map')
  }

  return location
}

export const LocationDetails: React.FunctionComponent = (): JSX.Element => {
  const location = useLocationDetails()

  console.log(location)
  let extraLink = location?.extraLink
  if (extraLink !== undefined && !extraLink?.startsWith('http')) {
    extraLink = `http://${extraLink}`
  }

  return (
    <div className="Map-Location-Details__container">
      <div className="Map-Location-Details__header">
        <Link className="Map-Location-Details__back-link" to="/map">
          <button
            className="Map-Location-Details__back button"
            onClick={() => {}}
          >
            <img
              className="Map-Location-Details__back-icon"
              src="/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-89.svg"
              alt="MonkeDAO Map Location Details Back Icon"
            />
            Back
          </button>
        </Link>
      </div>
      <div className="Map-Location-Details__body-container">
        <h1 className="Map-Location-Details__title">{location?.name}</h1>

        <div className="Map-Location-Details__info">
          <div className="Map-Location-Details__info-label">Date:</div>
          <div className="Map-Location-Details__info-value">
            {location?.startDate.toFormat('cccc, LLLL dd, yyyy, hh:mm a')}
          </div>
        </div>

        <div className="Map-Location-Details__info">
          <div className="Map-Location-Details__info-label">Location:</div>
          <div className="Map-Location-Details__info-value">
            {location?.text}
          </div>
          {location?.link ? (
            <a
              href={location?.link}
              className="Map-Location-Details-link"
              target="_blank"
            >
              map
              <img
                className="Map-Location-Details-link-icon"
                src="/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-79.svg"
                alt="MonkeDAO Map Location Details External Icon"
              />
            </a>
          ) : null}
        </div>
        {extraLink ? (
          <div className="Map-Location-Details__info">
            <div className="Map-Location-Details__info-label">
              External Link:
            </div>
            <a
              href={extraLink}
              className="Map-Location-Details-link"
              target="_blank"
            >
              more resources
              <img
                className="Map-Location-Details-link-icon"
                src="/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-79.svg"
                alt="MonkeDAO External Details Icon"
              />
            </a>
          </div>
        ) : null}
        {location?.contacts ? (
          <div className="Map-Location-Details__info">
            <div className="Map-Location-Details__info-label">Contacts:</div>
            <div className="Map-Location-Details__info-value">
              <img
                className="Map-Location-Details-link-icon"
                src="/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-50.svg"
                alt="MonkeDAO Contacts Icon"
              />
              {location?.contacts.join(', ')}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
