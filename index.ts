// This is a POC for a writable store, 
// this store is inspired by the beedle project (https://github.com/hankchizljaw/beedle), 
// vuex (https://github.com/vuejs/vuex) 
// and the svelte/store (https://github.com/sveltejs/svelte)


export default class Store {
  // Set our store defaults to hold actions, mutations, machines and status
  protected actions: object = {};
  protected mutations: object = {};
  protected state: object = {};
  protected status: string = "resting";

  // We store callbacks for when the state changes in here
  private callbacks: object[] = [];

  constructor(params: any = {}) {
    const self = this;

    // Look in the passed params object for actions and mutations
    // that might have been passed in
    if (params.hasOwnProperty("actions")) {
      self.actions = params.actions;
    }

    if (params.hasOwnProperty("mutations")) {
      self.mutations = params.mutations;
    }

    /*
     * Proxy is an object in javascript which wraps an object
     * or a function and monitors it via something called target.
     * Irrespective of the wrapped object or function existence
     *
     * let p = new Proxy(target, handler)
     *
     * It takes in two arguments on initialisation, : the target object which it virtualises
     * and a handler object which contains methods that provided property access
     *
     * Set our state to be a Proxy. We are setting the default state by
     * checking the params and defaulting to an empty object if no default
     * state is passed in
    */

    self.state = new Proxy((params.initialState || {}), {
      set(state: { [x: string]: any; }, key: string | number, value: any) {
        state[key] = value;

        // Fire off our callback processor because if there's listeners,
        // they're going to want to know that something has changed
        self.processCallbacks(self.state);

        self.status = "resting";
        return true;
      }
    });
  }
  
  // A dispatcher for actions that looks in the actions collection and runs the action if it can find it
  public dispatch(actionKey: string, payload?: any): boolean {
    const self = this;
    if (typeof self.actions[actionKey] !== "function") {
      console.error(`Action "${actionKey} doesn't exist.`);
      return false;
    }

    console.groupCollapsed(`ACTION: ${actionKey}`);
    self.status = "action";

    self.actions[actionKey](self, payload);
    console.groupEnd();

    return true;
  }

  // Look for a mutation and modify the state object if that mutation exists by calling it
  public commit(mutationKey: string, payload: any ): boolean {
    const self = this;
    if (typeof self.mutations[mutationKey] !== "function") {
      console.log(`Mutation "${mutationKey}" doesn't exist`);
      return false;
    }

    self.status = "mutation";
    // Get a new version of the state by running the mutation and storing the result of it
    const newState = self.mutations[mutationKey](self.state, payload);
    self.state = newState;

    return true;
  }

  /**
  * Fire off each callback that's run whenever the state changes
  * We pass in some data as the one and only parameter.
  * Returns a boolean depending if callbacks were found or not
  *
  * @param {object} data
  * @returns {boolean}
  */
  public processCallbacks(data?: object): boolean {
    const self = this;
    if (!self.callbacks.length) {
      return false;
    }

    self.callbacks.forEach(callback => callback(data));
    return true;
  }

  /*
   * Either create a new event instance for passed `event` name
   * or push a new callback into the existing collection
   *
  */

  public subscribe(callback: any): boolean {
    const self = this;

    // If there's not already an event with this name set in our collection
    // go ahead and create a new one and set it with an empty array, so we don't
    // have to type check it later down-the-line
    if (typeof callback !== "function") {
      console.error("You can only subscribe to Store changes with a valid function");
      return false;
    }

    // We know we've got an array for this event, so push our callback in there with no fuss
    self.callbacks.push(callback);
    return true;
  }
}
