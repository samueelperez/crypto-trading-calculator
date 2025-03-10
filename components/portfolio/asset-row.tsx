import React, { useEffect, useState } from 'react'
import { eventBus } from '../../services/event-bus'
import { EVENTS } from '../../constants/events'

const AssetRow = ({ asset }) => {
  const [forceUpdate, setForceUpdate] = useState(0)
  const [localAsset, setLocalAsset] = useState(asset)

  // Suscribirse a eventos de actualización para este asset específico
  useEffect(() => {
    const assetUpdatedUnsubscribe = eventBus.subscribe(EVENTS.ASSET_UPDATED, (data) => {
      if (data.asset.id === asset.id) {
        console.log(`AssetRow: Update received for ${asset.symbol}`)
        setForceUpdate(prev => prev + 1)
      }
    })
    
    return () => {
      assetUpdatedUnsubscribe()
    }
  }, [asset.id, asset.symbol])
  
  // Actualizar asset local cuando cambie el asset o el contador
  useEffect(() => {
    // Importante: actualizar el asset local cuando cambien las props
    setLocalAsset(asset)
  }, [asset, forceUpdate])

  return (
    <div>
      {/* Renderiza el componente con el asset actualizado */}
    </div>
  )
}

export default AssetRow 