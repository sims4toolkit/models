/**
 * Base for models that either can be cached or are part of another model that
 * can be cached. They may have an owning model that needs to be notified when
 * they are changed.
 */
export default abstract class CacheableModel {
  constructor(public owner?: CacheableModel) {}

  /**
   * Uncaches this model and notifies its owner (if it has one) to do the same.
   */
  uncache() {
    this.owner?.uncache();
  }
}
