import { App } from '@/app/App';
import { LocaleProvider } from '@/lib/i18n';

export default function Page() {
  return (
    <LocaleProvider>
      <App />
    </LocaleProvider>
  );
}
