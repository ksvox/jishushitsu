import Head from 'next/head';
import Gate from '../components/Gate';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="robots" content="noindex, nofollow" />
        <title>音楽自習室|ボーカル道場K's VOX</title>
      </Head>
      <Gate>
        <Component {...pageProps} />
      </Gate>
    </>
  );
}
