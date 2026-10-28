/* Espacios publicitarios laterales del navegador (portada y Spots).
   En el formato de celular no se muestran (ver App.css). */
export function HomeAd({ side }: { side: "left" | "right" }) {
  return (
    <aside className={`home-ad-col home-ad-${side}`} aria-label="Espacios publicitarios">
      <HomeAdCard />
      <HomeAdCard />
    </aside>
  );
}

function HomeAdCard() {
  return (
    <div className="home-ad">
      <p className="home-ad-title">TU EMPRENDIMIENTO ACÁ</p>
      <img
        className="home-ad-qr"
        src="/emprendimiento-qr.png"
        alt="Código QR para anunciar tu emprendimiento"
        width={168}
        height={168}
      />
    </div>
  );
}
