/**
 * Aviso cuando el celular PASA a Wi-Fi con la app abierta (@capacitor/network,
 * cargado solo cuando el disparador está activo). Seguir en Wi-Fi no repite:
 * solo cuenta el cambio de "otra red / sin red" a "Wi-Fi".
 */
export interface NetworkStatusLike {
  connected: boolean;
  connectionType: string;
}

export function isWifi(status: NetworkStatusLike): boolean {
  return status.connected && status.connectionType === "wifi";
}

/** Devuelve una función que responde true solo en la transición hacia Wi-Fi. */
export function createWifiTransitionDetector(initial: NetworkStatusLike): (status: NetworkStatusLike) => boolean {
  let wasWifi = isWifi(initial);
  return (status) => {
    const nowWifi = isWifi(status);
    const joined = nowWifi && !wasWifi;
    wasWifi = nowWifi;
    return joined;
  };
}

/** Se suscribe a los cambios de red; devuelve la función para dejar de escuchar. */
export async function watchWifiJoins(onJoin: () => void): Promise<() => void> {
  const { Network } = await import("@capacitor/network");
  const joinedWifi = createWifiTransitionDetector(await Network.getStatus());
  const handle = await Network.addListener("networkStatusChange", (status) => {
    if (joinedWifi(status)) onJoin();
  });
  return () => void handle.remove();
}
