/** An AbstractMethodError is thrown when you attempt to call an abstract method. */
export default class AbstractMethodError extends Error {
  /** Creates a new AbstractMethodError object. */
  constructor(message = 'Method needs to be implemented in subclass') {
    super(message)
  }
}
