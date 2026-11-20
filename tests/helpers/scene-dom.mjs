import {Window as DOMWindow} from 'happy-dom';
// DOM/controller tests use local fixtures, never perform real preload requests.
export class Window extends DOMWindow {
 constructor(options={}){super({url:'http://localhost',...options,settings:{...options.settings,fetch:{interceptor:{beforeAsyncRequest:async({window})=>new window.Response('')}}}});}
}
