import './styles.css';
import router from './router';
import { createApp } from 'vue';
import App from './app/App.vue';
import { showsPlugin } from './di/shows.plugin';

const app = createApp(App);

app.config.errorHandler = (err, _instance, info) => {
  console.error('[App error]', info, err);
};

app.use(router);
app.use(showsPlugin);
app.mount('#root');

