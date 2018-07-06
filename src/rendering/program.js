/** A Program represents a pair of a fragment- and vertex-shader.
 *
 *  <p>This class is a convenient replacement for Stage3Ds "Program3D" class. Its main
 *  advantage is that it survives a context loss; furthermore, it makes it simple to
 *  create a program from AGAL source without having to deal with the assembler.</p>
 *
 *  <p>It is recommended to store programs in Starling's "Painter" instance via the methods
 *  <code>registerProgram</code> and <code>getProgram</code>. That way, your programs may
 *  be shared among different display objects or even Starling instances.</p>
 *
 *  @see Painter
 */
export default class Program {
  _vertexShader
  _fragmentShader
  _program3D

  /** Creates a program from the given AGAL (Adobe Graphics Assembly Language) bytecode. */
  constructor(vertexShader, fragmentShader) {
    this._vertexShader = vertexShader
    this._fragmentShader = fragmentShader

    // Handle lost context (using conventional Flash event for weak listener support)
    //Starling.current.stage3D.addEventListener(Event.CONTEXT3D_CREATE,
    //    onContextCreated, false, 30, true);
  }

  /** Disposes the internal Program3D instance. */
  dispose() {
    //Starling.current.stage3D.removeEventListener(Event.CONTEXT3D_CREATE, onContextCreated);
    this.disposeProgram()
  }

  /** Creates a new Program instance from GLSL */
  static fromSource(vertexShader, fragmentShader) {
    return new Program(vertexShader, fragmentShader)
  }

  /** Activates the program on the given context. If you don't pass a context, the current
   *  Starling context will be used. */
  activate(gl = null) {
    if (!gl) {
      gl = window.StarlingContextManager.current.context
      if (!gl) throw new Error('[MissingContextError]')
    }

    if (!this._program3D) {
      const program = gl.createProgram()
      const vertexShader = this.createShader(
        gl,
        this._vertexShader,
        gl.VERTEX_SHADER
      )
      const fragmentShader = this.createShader(
        gl,
        this._fragmentShader,
        gl.FRAGMENT_SHADER
      )
      gl.attachShader(program, vertexShader)
      gl.deleteShader(vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.deleteShader(fragmentShader)
      gl.linkProgram(program)

      let log = gl.getProgramInfoLog(program)
      if (log) console.log(`ProgramLog\n${log}`)

      log = gl.getShaderInfoLog(vertexShader)
      if (log) console.log(`VertexShaderLog\n${log}`)

      log = gl.getShaderInfoLog(fragmentShader)
      if (log) console.log(`FragmentShaderLog\n${log}`)

      this._program3D = program
    }

    gl.useProgram(this._program3D)
  }

  get nativeProgram() {
    return this._program3D
  }

  createShader(gl, source, type) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader
  }

  disposeProgram() {
    if (this._program3D) {
      this._program3D.dispose()
      this._program3D = null
    }
  }
}
