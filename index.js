const { interval, EMPTY, of, Observable } = require('rxjs');
const { switchMap, startWith, catchError, tap } = require('rxjs/operators');
const { exec } = require('child_process');
const treeKill = require('tree-kill');
const browserSync = require('browser-sync');

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

const bs = browserSync.init({
  proxy: 'localhost:8000',
  server: false,
  notify: false,
  ghostMode: false,
  // files: ['./server']
  // logLevel: 'silent',
})

// Every 12 seconds force an emit and emulate a watch
interval(12 * 1000)
  .pipe(
    startWith(0),
    tap(() => console.info('updating...')),
    switchMap(() => execAsObservable('node ./server/index')),
    tap(() => bs.reload()),
    catchError(error => {
      console.error(error)
      return of(EMPTY);
    })
  )
  .subscribe();