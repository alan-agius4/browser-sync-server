const { interval, EMPTY, of, Observable } = require('rxjs');
const { switchMap, startWith, catchError, tap } = require('rxjs/operators');
const { exec } = require('child_process');
const { createServer } = require('net');
const treeKill = require('tree-kill');
const browserSync = require('browser-sync');

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server
      .unref()
      .on('error', reject)
      .listen(0, () => {
        const { port } = server.address();
        server.close(() => resolve(port));
      });
  });
}

function execAsObservable(command, options) {
  return new Observable(obs => {
    const proc = exec(command, options, (err, stdout, stderr) => {
      if (err) {
        obs.error(err);
        return;
      }

      obs.next({ stdout, stderr });
      obs.complete();
    });

    // find a better way
    obs.next({});
    return () => treeKill(proc.pid, 'SIGTERM');
  });
}

(async () => {
  const port = await getAvailablePort();

  const bs = browserSync.init({
    proxy: `localhost:${port}`,
    port: 4002,
    ui: false,
    server: false,
    notify: false,
    ghostMode: false,
    open: true,
    // files: ['./server'],
    // logLevel: 'silent',
  })


  // Every 12 seconds force an emit and emulate a watch
  interval(12 * 1000)
    .pipe(
      startWith(0),
      tap(() => console.info('updating...')),
      switchMap(() => execAsObservable('node ./server/index', {
        env: { ...process.env, PORT: port }
      })),
      tap(() => bs.reload()),
      catchError(error => {
        console.error(error)
        return of(EMPTY);
      })
    )
    .subscribe();
})();
