import {Component, OnInit} from '@angular/core';
import {BehaviorSubject, buffer, fromEvent, NEVER, Observable, Observer, timer} from 'rxjs';
import {debounceTime, filter, map, switchMap} from 'rxjs/operators';

const click$ = fromEvent(document, 'click');
const onDoubleClick$ = click$
  .pipe(
    buffer(click$.pipe(debounceTime(500))),
    map(clicks => clicks.length),
    filter(clicksLength => clicksLength >= 2)
  );

function stopWatch(
  starterStopper: Observable<boolean>,
  isOnPause: Observable<boolean>,
  fps: number
): Observable<number> {
  return new Observable((obs: Observer<number>) => {
    let i = 0;
    let ticker = starterStopper.pipe(
      switchMap(start => {
        if (start) return timer(0, 1000 / fps).pipe(map(_ => i++))
        i = 0;
        return NEVER;
      })
    );

    let p = isOnPause.pipe(switchMap(paused => (paused ? ticker : NEVER)));
    return p.subscribe({
      next: value => obs.next(value),
      error: err => obs.error(err),
      complete: () => obs.complete()
    });
  });
}

@Component({
  selector: 'app-stopwatch',
  templateUrl: './stopwatch.component.html',
  styleUrls: ['./stopwatch.component.scss']
})

export class StopwatchComponent implements OnInit {
  isOnPause = new BehaviorSubject<boolean>(false);
  starterStopper = new BehaviorSubject<boolean>(false);
  stopWatch = new BehaviorSubject<string>('00:00');

  ngOnInit() {
    stopWatch(this.starterStopper, this.isOnPause, 100).subscribe({
      next: value => this.stopWatch.next(this.SecondsToMinutes(value))
    });
  };

  handleStart() {
    this.starterStopper.next(true);
    if (!this.isOnPause.value) {
      this.isOnPause.next(true)
    }
  };

  handleStop() {
    this.starterStopper.next(false);
    this.isOnPause.next(false);
    this.stopWatch.next('00:00');
  };

  handlePause() {
    onDoubleClick$.subscribe(_ => {
      if (this.starterStopper.value) {
        this.isOnPause.next(false);
      }
    });
  };

  handleReset() {
    this.handleStop()
    this.handleStart()
    this.stopWatch.next('00:00');
  };

  SecondsToMinutes(msElapsed: any) {
    let padZero = (value: number) => String(value).padStart(2, '0');

    msElapsed = Number(msElapsed);
    const hElapsed = msElapsed / 360000;
    const hRemaining = hElapsed % 24;
    const sRemaining = (hRemaining * 3600) % 3600;

    const m = Math.floor(sRemaining / 60);
    const s = Math.floor(sRemaining % 60);

    const mDisplay = padZero(m) + ':';
    const sDisplay = padZero(s);
    return `${mDisplay}${sDisplay}`;
  };

  ngOnDestroy() {
    this.starterStopper.complete();
    this.isOnPause.complete();
  };
}
