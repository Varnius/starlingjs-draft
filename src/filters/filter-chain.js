import Padding from '../utils/padding'
import FragmentFilter from './fragment-filter'
import Event from '../events/event'

/** The FilterChain allows you to combine several filters into one. The filters will be
 *  processed in the given order, the number of draw calls per filter adding up.
 *  Just like conventional filters, a chain may be attached to any display object.
 */
export default class FilterChain extends FragmentFilter {
  _filters

  // helpers
  static sPadding = new Padding()

  /** Creates a new chain with the given filters. */
  constructor(...args) {
    super()
    this._filters = []

    for (let i = 0, len = args.length; i < len; ++i) {
      const filter = args[i] instanceof FragmentFilter ? args[i] : null
      if (filter) this.addFilterAt(filter, i)
      else
        throw new Error(
          '[ArgumentError] pass only fragment filters to the constructor'
        )
    }

    this.updatePadding()
    this.addEventListener(Event.ENTER_FRAME, this.onEnterFrame)
  }

  /** Disposes the filter chain itself as well as all contained filters. */
  dispose() {
    for (const filter of this._filters) filter.dispose()

    this._filters.length = 0
    super.dispose()
  }

  /** @private */
  setRequiresRedraw() {
    this.updatePadding()
    super.setRequiresRedraw()
  }

  /** @private */
  process(painter, helper, input0 = null) {
    const numFilters = this._filters.length
    let outTexture = input0
    let inTexture

    for (let i = 0; i < numFilters; ++i) {
      inTexture = outTexture
      outTexture = this._filters[i].process(painter, helper, inTexture)

      if (i) helper.putTexture(inTexture)
    }

    return outTexture
  }

  /** @private */
  get numPasses() {
    let numPasses = 0
    const numFilters = this._filters.length

    for (let i = 0; i < numFilters; ++i) numPasses += this._filters[i].numPasses

    return numPasses
  }

  /** Returns the filter at a certain index. If you pass a negative index,
   *  '-1' will return the last filter, '-2' the second to last filter, etc. */
  getFilterAt(index) {
    if (index < 0) index += this.numFilters
    return this._filters[index]
  }

  /** Adds a filter to the chain. It will be appended at the very end. */
  addFilter(filter) {
    this.addFilterAt(filter, this._filters.length)
  }

  /** Adds a filter to the chain at the given index. */
  addFilterAt(filter, index) {
    this._filters.splice(index, 0, filter)
    filter.addEventListener(Event.CHANGE, this.setRequiresRedraw)
    this.setRequiresRedraw()
  }

  /** Removes a filter from the chain. If the filter is not part of the chain,
   *  nothing happens. If requested, the filter will be disposed right away. */
  removeFilter(filter, dispose = false) {
    const filterIndex = this.getFilterIndex(filter)
    if (filterIndex !== -1) this.removeFilterAt(filterIndex, dispose)
    return filter
  }

  /** Removes the filter at a certain index. The indices of any subsequent filters
   *  are decremented. If requested, the filter will be disposed right away. */
  removeFilterAt(index, dispose = false) {
    const filter = this._filters.splice(index, 1)
    filter.removeEventListener(Event.CHANGE, this.setRequiresRedraw)
    if (dispose) filter.dispose()
    this.setRequiresRedraw()
    return filter
  }

  /** Returns the index of a filter within the chain, or '-1' if it is not found. */
  getFilterIndex(filter) {
    return this._filters.indexOf(filter)
  }

  updatePadding() {
    const { sPadding } = FilterChain
    sPadding.setTo()

    for (const filter of this._filters) {
      const padding = filter.padding
      if (padding.left > sPadding.left) sPadding.left = padding.left
      if (padding.right > sPadding.right) sPadding.right = padding.right
      if (padding.top > sPadding.top) sPadding.top = padding.top
      if (padding.bottom > sPadding.bottom) sPadding.bottom = padding.bottom
    }

    this.padding.copyFrom(sPadding)
  }

  onEnterFrame = event => {
    const numFilters = this._filters.length
    for (let i = 0; i < numFilters; ++i) this._filters[i].dispatchEvent(event)
  }

  /** Indicates the current chain length. */
  get numFilters() {
    return this._filters.length
  }
}
