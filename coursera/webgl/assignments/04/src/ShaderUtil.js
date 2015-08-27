let ShaderUtil = (() => {
    return {
        loadShader(gl, shader) {
            let shaderId = gl.createShader(shader.type);
            gl.shaderSource(shaderId, shader.content);
            gl.compileShader(shaderId);
            if(!gl.getShaderParameter(shaderId, gl.COMPILE_STATUS) ) {
                throw Error(`Vertex shader failed to compile. The error log is:
                    <pre>${gl.getShaderInfoLog(shaderId)}</pre>`);
            }
            return shaderId;
        },
        createPrograms(gl, programs) {
            let result = [];

            programs.forEach(program => {
                let programId = gl.createProgram();
                gl.attachShader(programId, this.loadShader(gl, program.vertexShader));
                gl.attachShader(programId, this.loadShader(gl, program.fragmentShader));
                gl.linkProgram(programId);

                if(!gl.getProgramParameter(programId, gl.LINK_STATUS) ) {
                    throw Error(`Shader program failed to link.  The error log is:
                        <pre>${gl.getProgramInfoLog(program)}</pre>`);
                }

                result.push(programId);
            });

            return result;
        }
    }
})();
