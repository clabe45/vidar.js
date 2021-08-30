import { Dynamic, val, applyOptions } from '../util'
import { Base, BaseOptions } from './base'
import { Visual, VisualOptions } from './visual'

type Constructor<T> = new (...args: unknown[]) => T

interface VisualSource extends Base {
  readonly source: HTMLImageElement | HTMLVideoElement
}

interface VisualSourceOptions extends VisualOptions {
  source: HTMLImageElement | HTMLVideoElement
  /** What part of {@link source} to render */
  sourceX?: Dynamic<number>
  /** What part of {@link source} to render */
  sourceY?: Dynamic<number>
  /** What part of {@link source} to render, or undefined for the entire width */
  sourceWidth?: Dynamic<number>
  /** What part of {@link source} to render, or undefined for the entire height */
  sourceHeight?: Dynamic<number>
  /** Where to render {@link source} onto the layer */
  destX?: Dynamic<number>
  /** Where to render {@link source} onto the layer */
  destY?: Dynamic<number>
  /** Where to render {@link source} onto the layer, or undefined to fill the layer's width */
  destWidth?: Dynamic<number>
  /** Where to render {@link source} onto the layer, or undefined to fill the layer's height */
  destHeight?: Dynamic<number>
}

/**
 * A layer that gets its image data from an HTML image or video element
 * @mixin VisualSourceMixin
 */
function VisualSourceMixin<OptionsSuperclass extends BaseOptions> (superclass: Constructor<Visual>): Constructor<VisualSource> {
  type MixedVisualSourceOptions = OptionsSuperclass & VisualSourceOptions

  class MixedVisualSource extends superclass {
    /**
     * The raw html media element
     */
    readonly source: HTMLImageElement | HTMLVideoElement

    /** What part of {@link source} to render */
    sourceX: Dynamic<number>
    /** What part of {@link source} to render */
    sourceY: Dynamic<number>
    /** What part of {@link source} to render, or undefined for the entire width */
    sourceWidth: Dynamic<number>
    /** What part of {@link source} to render, or undefined for the entire height */
    sourceHeight: Dynamic<number>
    /** Where to render {@link source} onto the layer */
    destX: Dynamic<number>
    /** Where to render {@link source} onto the layer */
    destY: Dynamic<number>
    /** Where to render {@link source} onto the layer, or undefined to fill the layer's width */
    destWidth: Dynamic<number>
    /** Where to render {@link source} onto the layer, or undefined to fill the layer's height */
    destHeight: Dynamic<number>

    constructor (options: MixedVisualSourceOptions) {
      super(options)
      applyOptions(options, this)
    }

    doRender () {
      // Clear/fill background
      super.doRender()

      /*
       * Source dimensions crop the image. Dest dimensions set the size that
       * the image will be rendered at *on the layer*. Note that this is
       * different than the layer dimensions (`this.width` and `this.height`).
       * The main reason this distinction exists is so that an image layer can
       * be rotated without being cropped (see iss #46).
       */
      this.cctx.drawImage(
        this.source,
        val(this, 'sourceX'), val(this, 'sourceY'),
        val(this, 'sourceWidth'), val(this, 'sourceHeight'),
        // `destX` and `destY` are relative to the layer
        val(this, 'destX'), val(this, 'destY'),
        val(this, 'destWidth'), val(this, 'destHeight')
      )
    }

    getDefaultOptions (): MixedVisualSourceOptions {
      return {
        ...superclass.prototype.getDefaultOptions(),
        source: undefined, // required
        sourceX: 0,
        sourceY: 0,
        sourceWidth: undefined,
        sourceHeight: undefined,
        destX: 0,
        destY: 0,
        destWidth: undefined,
        destHeight: undefined
      }
    }
  }
  MixedVisualSource.prototype.propertyFilters = {
    ...Visual.prototype.propertyFilters,

    /*
     * If no layer width was provided, fall back to the dest width.
     * If no dest width was provided, fall back to the source width.
     * If no source width was provided, fall back to `source.width`.
     */
    sourceWidth: function (sourceWidth) {
      // != instead of !== to account for `null`
      const width = this.source instanceof HTMLImageElement
        ? this.source.width
        : this.source.videoWidth
      return sourceWidth != undefined ? sourceWidth : width // eslint-disable-line eqeqeq
    },
    sourceHeight: function (sourceHeight) {
      const height = this.source instanceof HTMLImageElement
        ? this.source.height
        : this.source.videoHeight
      return sourceHeight != undefined ? sourceHeight : height // eslint-disable-line eqeqeq
    },
    destWidth: function (destWidth) {
      // I believe reltime is redundant, as element#currentTime can be used
      // instead. (TODO: fact check)
      /* eslint-disable eqeqeq */
      return destWidth != undefined
        ? destWidth : val(this, 'sourceWidth')
    },
    destHeight: function (destHeight) {
      /* eslint-disable eqeqeq */
      return destHeight != undefined
        ? destHeight : val(this, 'sourceHeight')
    },
    width: function (width) {
      /* eslint-disable eqeqeq */
      return width != undefined
        ? width : val(this, 'destWidth')
    },
    height: function (height) {
      /* eslint-disable eqeqeq */
      return height != undefined
        ? height : val(this, 'destHeight')
    }
  }

  return MixedVisualSource
}

export { VisualSource, VisualSourceOptions, VisualSourceMixin }
