import DisplayObject from './display-object';

import MeshStyle from '../styles/mesh-style';

import VertexData from '../rendering/vertex-data';

import MeshUtil from '../utils/mesh-util';
import MatrixUtil from '../utils/matrix-util';

/** The base class for all tangible (non-container) display objects, spawned up by a number
 *  of triangles.
 *
 *  <p>Since Starling uses Stage3D for rendering, all rendered objects must be constructed
 *  from triangles. A mesh stores the information of its triangles through VertexData and
 *  IndexData structures. The default format stores position, color and texture coordinates
 *  for each vertex.</p>
 *
 *  <p>How a mesh is rendered depends on its style. Per default, this is an instance
 *  of the <code>MeshStyle</code> base class; however, subclasses may extend its behavior
 *  to add support for color transformations, normal mapping, etc.</p>
 *
 *  @see MeshBatch
 *  @see starling.styles.MeshStyle
 *  @see starling.rendering.VertexData
 *  @see starling.rendering.IndexData
 */
export default class Mesh extends DisplayObject {
    _style;
    _vertexData;
    _indexData;
    _pixelSnapping;

    static sDefaultStyle = MeshStyle;
    static sDefaultStyleFactory = null;

    /** Creates a new mesh with the given vertices and indices.
     *  If you don't pass a style, an instance of <code>MeshStyle</code> will be created
     *  for you. Note that the format of the vertex data will be matched to the
     *  given style right away. */
    constructor(vertexData, indexData, style = null) {
        super();

        if (!vertexData) throw new Error('[ArgumentError] VertexData must not be null');
        if (!indexData) throw new Error('[ArgumentError] IndexData must not be null');

        this._vertexData = vertexData;
        this._indexData = indexData;

        this.setStyle(style, false);
    }

    /** @inheritDoc */
    dispose() {
        this._vertexData.clear();
        this._indexData.clear();

        super.dispose();
    }

    /** @inheritDoc */
    hitTest(localPoint) {
        if (!this.visible || !this.touchable || !this.hitTestMask(localPoint)) return null;
        else return MeshUtil.containsPoint(this._vertexData, this._indexData, localPoint) ? this : null;
    }

    /** @inheritDoc */
    getBounds(targetSpace, out = null) {
        return MeshUtil.calculateBounds(this._vertexData, this, targetSpace, out);
    }

    /** @inheritDoc */
    render(painter) {
        if (this._pixelSnapping) MatrixUtil.snapToPixels(painter.state.modelviewMatrix, painter.pixelSize);

        painter.batchMesh(this);
    }

    /** Sets the style that is used to render the mesh. Styles (which are always subclasses of
     *  <code>MeshStyle</code>) provide a means to completely modify the way a mesh is rendered.
     *  For example, they may add support for color transformations or normal mapping.
     *
     *  <p>When assigning a new style, the vertex format will be changed to fit it.
     *  Do not use the same style instance on multiple objects! Instead, make use of
     *  <code>style.clone()</code> to assign an identical style to multiple meshes.</p>
     *
     *  @param meshStyle             the style to assign. If <code>null</code>, the default
     *                               style will be created.
     *  @param mergeWithPredecessor  if enabled, all attributes of the previous style will be
     *                               be copied to the new one, if possible.
     *  @see #defaultStyle
     *  @see #defaultStyleFactory
     */
    setStyle(meshStyle = null, mergeWithPredecessor = true) {
        const { _vertexData, _indexData } = this;

        if (!meshStyle) meshStyle = this.createDefaultMeshStyle();
        else if (meshStyle === this._style) return;
        else if (meshStyle.target) meshStyle.target.setStyle();

        if (this._style) {
            if (mergeWithPredecessor) meshStyle.copyFrom(this._style);
            this._style.setTarget();
        }

        this._style = meshStyle;
        this._style.setTarget(this, _vertexData, _indexData);

        this.setRequiresRedraw();
    }

    createDefaultMeshStyle() {
        let meshStyle;

        if (Mesh.sDefaultStyleFactory) {
            if (Mesh.sDefaultStyleFactory.length === 0) meshStyle = Mesh.sDefaultStyleFactory();
            else meshStyle = Mesh.sDefaultStyleFactory(this);
        }

        if (!meshStyle) meshStyle = new (Mesh.sDefaultStyle)();
        if (meshStyle instanceof MeshStyle) return meshStyle;

        return null;
    }

    /** This method is called whenever the mesh's vertex data was changed.
     *  The base implementation simply forwards to <code>setRequiresRedraw</code>. */
    setVertexDataChanged() {
        this.setRequiresRedraw();
    }

    /** This method is called whenever the mesh's index data was changed.
     *  The base implementation simply forwards to <code>setRequiresRedraw</code>. */
    setIndexDataChanged() {
        this.setRequiresRedraw();
    }

    // vertex manipulation

    /** The position of the vertex at the specified index, in the mesh's local coordinate
     *  system.
     *
     *  <p>Only modify the position of a vertex if you know exactly what you're doing, as
     *  some classes might not work correctly when their vertices are moved. E.g. the
     *  <code>Quad</code> class expects its vertices to spawn up a perfectly rectangular
     *  area; some of its optimized methods won't work correctly if that premise is no longer
     *  fulfilled or the original bounds change.</p>
     */
    getVertexPosition(vertexID, out = null) {
        return this._style.getVertexPosition(vertexID, out);
    }

    setVertexPosition(vertexID, x, y) {
        this._style.setVertexPosition(vertexID, x, y);
    }

    /** Returns the alpha value of the vertex at the specified index. */
    getVertexAlpha(vertexID) {
        return this._style.getVertexAlpha(vertexID);
    }

    /** Sets the alpha value of the vertex at the specified index to a certain value. */
    setVertexAlpha(vertexID, alpha) {
        this._style.setVertexAlpha(vertexID, alpha);
    }

    /** Returns the RGB color of the vertex at the specified index. */
    getVertexColor(vertexID) {
        return this._style.getVertexColor(vertexID);
    }

    /** Sets the RGB color of the vertex at the specified index to a certain value. */
    setVertexColor(vertexID, color) {
        this._style.setVertexColor(vertexID, color);
    }

    /** Returns the texture coordinates of the vertex at the specified index. */
    getTexCoords(vertexID, out = null) {
        return this._style.getTexCoords(vertexID, out);
    }

    /** Sets the texture coordinates of the vertex at the specified index to the given values. */
    setTexCoords(vertexID, u, v) {
        this._style.setTexCoords(vertexID, u, v);
    }

    // properties

    /** The vertex data describing all vertices of the mesh.
     *  Any change requires a call to <code>setRequiresRedraw</code>. */
    get vertexData() {
        return this._vertexData;
    }

    /** The index data describing how the vertices are interconnected.
     *  Any change requires a call to <code>setRequiresRedraw</code>. */
    get indexData() {
        return this._indexData;
    }

    /** The style that is used to render the mesh. Styles (which are always subclasses of
     *  <code>MeshStyle</code>) provide a means to completely modify the way a mesh is rendered.
     *  For example, they may add support for color transformations or normal mapping.
     *  Beware: a style instance may only be used on one mesh at a time.
     *
     *  @default MeshStyle
     *  @see #setStyle()
     */
    get style() {
        return this._style;
    }

    set style(value) {
        this.setStyle(value);
    }

    /** The texture that is mapped to the mesh (or <code>null</code>, if there is none). */
    get texture() {
        return this._style.texture;
    }

    set texture(value) {
        this._style.texture = value;
    }

    /** Changes the color of all vertices to the same value.
     *  The getter simply returns the color of the first vertex. */
    get color() {
        return this._style.color;
    }

    set color(value) {
        this._style.color = value;
    }

    /** The smoothing filter that is used for the texture.
     *  @default bilinear */
    get textureSmoothing() {
        return this._style.textureSmoothing;
    }

    set textureSmoothing(value) {
        this._style.textureSmoothing = value;
    }

    /** Indicates if pixels at the edges will be repeated or clamped. Only works for
     *  power-of-two textures; for a solution that works with all kinds of textures,
     *  see <code>Image.tileGrid</code>. @default false */
    get textureRepeat() {
        return this._style.textureRepeat;
    }

    set textureRepeat(value) {
        this._style.textureRepeat = value;
    }

    /** Controls whether or not the instance snaps to the nearest pixel. This can prevent the
     *  object from looking blurry when it's not exactly aligned with the pixels of the screen.
     *  @default false */
    get pixelSnapping() {
        return this._pixelSnapping;
    }

    set pixelSnapping(value) {
        this._pixelSnapping = value;
    }

    /** The total number of vertices in the mesh. */
    get numVertices() {
        return this._vertexData.numVertices;
    }

    /** The total number of indices referencing vertices. */
    get numIndices() {
        return this._indexData.numIndices;
    }

    /** The total number of triangles in this mesh.
     *  (In other words: the number of indices divided by three.) */
    get numTriangles() {
        return this._indexData.numTriangles;
    }

    /** The format used to store the vertices. */
    get vertexFormat() {
        return this._style.vertexFormat;
    }

    // static properties

    /** The default style used for meshes if no specific style is provided. The default is
     *  <code>starling.rendering.MeshStyle</code>, and any assigned class must be a subclass
     *  of the same. */
    static get defaultStyle() {
        return Mesh.sDefaultStyle;
    }

    static set defaultStyle(value) {
        Mesh.sDefaultStyle = value;
    }

    /** A factory method that is used to create the 'MeshStyle' for a mesh if no specific
     *  style is provided. That's useful if you are creating a hierarchy of objects, all
     *  of which need to have a certain style. Different to the <code>defaultStyle</code>
     *  property, this method allows plugging in custom logic and passing arguments to the
     *  constructor. Return <code>null</code> to fall back to the default behavior (i.e.
     *  to instantiate <code>defaultStyle</code>). The <code>mesh</code>-parameter is optional
     *  and may be omitted.
     *
     *  <listing>
     *  Mesh.defaultStyleFactory = function(mesh)
     *  {
         *      return new ColorizeMeshStyle(Math.random() * 0xffffff);
         *  }</listing>
     */
    static get defaultStyleFactory() {
        return Mesh.sDefaultStyleFactory;
    }

    static set defaultStyleFactory(value) {
        Mesh.sDefaultStyleFactory = value;
    }

    // static methods

    /** Creates a mesh from the specified polygon.
     *  Vertex positions and indices will be set up according to the polygon;
     *  any other vertex attributes (e.g. texture coordinates) need to be set up manually.
     */
    static fromPolygon(polygon, style = null) {
        const vertexData = new VertexData(null, polygon.numVertices);
        const indexData = new IndexData(polygon.numTriangles);

        polygon.copyToVertexData(vertexData);
        polygon.triangulate(indexData);

        return new Mesh(vertexData, indexData, style);
    }
}
