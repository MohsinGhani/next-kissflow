import { PrimeReactProvider } from "primereact/api";

import "../scss/index.scss";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primeicons/primeicons.css";

export default function App({ Component, pageProps }) {
  return (
    <PrimeReactProvider>
      
      <Component {...pageProps} />
    </PrimeReactProvider>
  );
}
