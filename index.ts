import './style.css';

import { fromEvent, of, merge, empty, concat, defer } from 'rxjs';
import { delay, map, mergeMap, tap, debounceTime, distinctUntilChanged, mapTo, filter, share, switchAll, switchMap } from 'rxjs/operators';
import { ifElse } from 'ramda';
import { format } from 'date-fns';

// track in progress saves
let savesInProgress = 0;

let historyCursor = 0;
let historyData = [];

// references
const input = document.getElementById('note-input');
const saveIndicator = document.querySelector('.save-indicator');

// streams
// @ts-ignore
const keyup$ = fromEvent(input, 'keyup');

// @ts-ignore
const addText = (elId, text) => {
    console.log('value : ' + text);
    let textInput = text.split(" ");
    console.log("textInput: " + textInput[0]);
    if(textInput[0] === "console" || textInput[0] === "function"){
        console.log("INside eval");
        try {
          setTimeout(function() {
            // @ts-ignore
            document.getElementById(elId).value += eval("("+text+")")+ "\n";
          }, 1000);
        } catch (e) {
          alert( "won't work" );
        }
        
    }else {
        console.log("INside findResult");
        let finalVal = findResult(elId, text);
        // @ts-ignore
        document.getElementById(elId).value += finalVal + "\n";
    }
    
}

// @ts-ignore
const findResult = (elId, value) => {
  var valueToEval = value;
  console.log("valueToEval : " + valueToEval);
  let result = "";
  try {
    if(valueToEval instanceof Function){
      var fn = "fn = " + "'"+valueToEval+"'";
      result = eval(fn);
    }else{
      result = eval(valueToEval);
    }
    
    // result =  'use strict;return (' + valueToEval + ')';
    console.log("resultEval : " + result);
    return result;
  } catch (e) {
    // @ts-ignore
    document.getElementById(elId).value += e + "\n";
  }
  
}

// fake save request
// @ts-ignore
const saveChanges = value => {
    console.log("value : " + value);
    addText('note-input', value);
    return of(value).pipe(delay(1500))
};

// @ts-ignore
const getContinents = keys => [
  'console.log',
  'let',
  'var',
  'const',
  'function',
  'array'
].filter(e => e.indexOf(keys.toLowerCase()) > -1);

const enterEntered = () => {}

// @ts-ignore
const fakeContinentsRequest = keys => of(getContinents(keys))
  .pipe(
    tap(_ => console.log(`API CALL at ${new Date()}`))
  );

// @ts-ignore
const checkKeyPressed = (keyCode) => {
  console.log("Inside checkKeyPressed");
  if(keyCode == 13){ // enter
    console.log("enter");
    return;
  }else if(keyCode == 13 && keyCode == 16){ // enter and shift
    console.log("enter and shift");
  }else if(keyCode == 38) { // UP arrow
    console.log("UP arrow");
    if (historyCursor < 0) {
      historyCursor = 0;
      return;
    }
    historyCursor++;
    // @ts-ignore
    let value = history[historyCursor];
    // @ts-ignore
    document.getElementById(elId).value += value + "\n";
    return;
  }else if(keyCode == 40) { // DOWN arrow
    console.log("DOWN arrow");
    if (historyCursor == historyCursor) {
      historyCursor = historyCursor;
      return;
    }
    historyCursor--;
    // @ts-ignore
    let value = history[historyCursor];
    // @ts-ignore
    document.getElementById(elId).value += value + "\n";
    return;
  }else {
    console.log("else...");
  }
}

/**
 * Trigger a save when the user stops typing for 200ms
 * After new data has been successfully saved, so a saved
 * and last updated indicator.
 */
const inputToSave$ = keyup$.pipe(
    //debounceTime(200),
    // @ts-ignore
    // mergeMap((e: KeyboardEvent) => checkKeyPressed(e.keyCode)),
    // @ts-ignore
    // checkKeyPressed((e: KeyboardEvent) => e.keyCode),
    filter((e: KeyboardEvent) => e.keyCode === 13),
    // @ts-ignore
    map(e => e.target.value),
    distinctUntilChanged(),
    share(),
    // switchMap(fakeContinentsRequest),
    // tap(c => document.getElementById('output').innerText = c.join('\n'))
  );

const savesInProgress$ = inputToSave$.pipe(

  mapTo(of('Saving')),
  tap(_ => savesInProgress++)
);

const savesCompleted$ = inputToSave$.pipe(
   mergeMap(saveChanges),
   tap(_ => savesInProgress--),
   // ignore if additional saves are in progress
   filter(_ => !savesInProgress),
   mapTo(concat(
    // display saved for 2s
    of('Saved!'),
    empty().pipe(delay(2000)),
    // then last updated time, defer for proper time
    defer(() => of(`Last updated: ${format(Date.now(), 'MM/DD/YYYY hh:mm')}`))
  ))
);

merge(
  // checkKeyPressed$,
  savesInProgress$,
  savesCompleted$
).pipe(
  /*
   If new save comes in when our completion observable is running, we want to switch to it for a status update.
  */
  switchAll()
)
.subscribe(status => {
    // @ts-ignore
  saveIndicator.innerHTML = status;
});
  
