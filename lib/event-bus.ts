// Sistema simple de eventos para comunicación entre componentes
type EventCallback = (...args: any[]) => void

interface EventMap {
  [eventName: string]: EventCallback[]
}

class EventBus {
  private events: EventMap = {}

  /**
   * Suscribirse a un evento
   */
  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.events[event]) {
      this.events[event] = []
    }

    this.events[event].push(callback)

    // Retornar función para cancelar la suscripción
    return () => {
      this.events[event] = this.events[event].filter((cb) => cb !== callback)
    }
  }

  /**
   * Publicar un evento
   */
  publish(event: string, ...args: any[]): void {
    console.log(`EventBus: Publishing event "${event}"`, args)
    
    if (!this.events[event]) {
      return
    }

    this.events[event].forEach((callback) => {
      try {
        callback(...args)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    })
  }
}

// Crear una instancia global que se puede importar en cualquier parte de la aplicación
export const eventBus = new EventBus()

// Eventos disponibles en la aplicación
export const EVENTS = {
  EXCHANGE_ADDED: "EXCHANGE_ADDED",
  EXCHANGE_UPDATED: "EXCHANGE_UPDATED",
  EXCHANGE_DELETED: "EXCHANGE_DELETED",
  ASSET_ADDED: "ASSET_ADDED",
  ASSET_UPDATED: "ASSET_UPDATED",
  ASSET_DELETED: "ASSET_DELETED",
  PORTFOLIO_REFRESHED: "PORTFOLIO_REFRESHED",
  SETTINGS_UPDATED: "SETTINGS_UPDATED",
} 