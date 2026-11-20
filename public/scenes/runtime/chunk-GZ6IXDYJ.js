import{CopyShader}from"./chunk-7ZK3HIBW.js";import{FullScreenQuad,Pass}from"./chunk-OKOBSQNM.js";import{AddEquation,Color,CustomBlending,DataTexture,DepthStencilFormat,DepthTexture,DstAlphaFactor,DstColorFactor,FloatType,HalfFloatType,MathUtils,Matrix4,MeshNormalMaterial,NearestFilter,NoBlending,RedFormat,RepeatWrapping,ShaderMaterial,UniformsUtils,UnsignedInt248Type,Vector2,Vector3,WebGLRenderTarget,ZeroFactor}from"./chunk-NDMH5YZ5.js";var SimplexNoise=class{constructor(r=Math){this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],this.grad4=[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]],this.p=[];for(let i=0;i<256;i++)this.p[i]=Math.floor(r.random()*256);this.perm=[];for(let i=0;i<512;i++)this.perm[i]=this.p[i&255];this.simplex=[[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]}dot(g,x,y){return g[0]*x+g[1]*y}dot3(g,x,y,z){return g[0]*x+g[1]*y+g[2]*z}dot4(g,x,y,z,w){return g[0]*x+g[1]*y+g[2]*z+g[3]*w}noise(xin,yin){let n0,n1,n2,F2=.5*(Math.sqrt(3)-1),s=(xin+yin)*F2,i=Math.floor(xin+s),j=Math.floor(yin+s),G2=(3-Math.sqrt(3))/6,t=(i+j)*G2,X0=i-t,Y0=j-t,x0=xin-X0,y0=yin-Y0,i1,j1;x0>y0?(i1=1,j1=0):(i1=0,j1=1);let x1=x0-i1+G2,y1=y0-j1+G2,x2=x0-1+2*G2,y2=y0-1+2*G2,ii=i&255,jj=j&255,gi0=this.perm[ii+this.perm[jj]]%12,gi1=this.perm[ii+i1+this.perm[jj+j1]]%12,gi2=this.perm[ii+1+this.perm[jj+1]]%12,t0=.5-x0*x0-y0*y0;t0<0?n0=0:(t0*=t0,n0=t0*t0*this.dot(this.grad3[gi0],x0,y0));let t1=.5-x1*x1-y1*y1;t1<0?n1=0:(t1*=t1,n1=t1*t1*this.dot(this.grad3[gi1],x1,y1));let t2=.5-x2*x2-y2*y2;return t2<0?n2=0:(t2*=t2,n2=t2*t2*this.dot(this.grad3[gi2],x2,y2)),70*(n0+n1+n2)}noise3d(xin,yin,zin){let n0,n1,n2,n3,s=(xin+yin+zin)*.3333333333333333,i=Math.floor(xin+s),j=Math.floor(yin+s),k=Math.floor(zin+s),G3=1/6,t=(i+j+k)*G3,X0=i-t,Y0=j-t,Z0=k-t,x0=xin-X0,y0=yin-Y0,z0=zin-Z0,i1,j1,k1,i2,j2,k2;x0>=y0?y0>=z0?(i1=1,j1=0,k1=0,i2=1,j2=1,k2=0):x0>=z0?(i1=1,j1=0,k1=0,i2=1,j2=0,k2=1):(i1=0,j1=0,k1=1,i2=1,j2=0,k2=1):y0<z0?(i1=0,j1=0,k1=1,i2=0,j2=1,k2=1):x0<z0?(i1=0,j1=1,k1=0,i2=0,j2=1,k2=1):(i1=0,j1=1,k1=0,i2=1,j2=1,k2=0);let x1=x0-i1+G3,y1=y0-j1+G3,z1=z0-k1+G3,x2=x0-i2+2*G3,y2=y0-j2+2*G3,z2=z0-k2+2*G3,x3=x0-1+3*G3,y3=y0-1+3*G3,z3=z0-1+3*G3,ii=i&255,jj=j&255,kk=k&255,gi0=this.perm[ii+this.perm[jj+this.perm[kk]]]%12,gi1=this.perm[ii+i1+this.perm[jj+j1+this.perm[kk+k1]]]%12,gi2=this.perm[ii+i2+this.perm[jj+j2+this.perm[kk+k2]]]%12,gi3=this.perm[ii+1+this.perm[jj+1+this.perm[kk+1]]]%12,t0=.6-x0*x0-y0*y0-z0*z0;t0<0?n0=0:(t0*=t0,n0=t0*t0*this.dot3(this.grad3[gi0],x0,y0,z0));let t1=.6-x1*x1-y1*y1-z1*z1;t1<0?n1=0:(t1*=t1,n1=t1*t1*this.dot3(this.grad3[gi1],x1,y1,z1));let t2=.6-x2*x2-y2*y2-z2*z2;t2<0?n2=0:(t2*=t2,n2=t2*t2*this.dot3(this.grad3[gi2],x2,y2,z2));let t3=.6-x3*x3-y3*y3-z3*z3;return t3<0?n3=0:(t3*=t3,n3=t3*t3*this.dot3(this.grad3[gi3],x3,y3,z3)),32*(n0+n1+n2+n3)}noise4d(x,y,z,w){let grad4=this.grad4,simplex=this.simplex,perm=this.perm,F4=(Math.sqrt(5)-1)/4,G4=(5-Math.sqrt(5))/20,n0,n1,n2,n3,n4,s=(x+y+z+w)*F4,i=Math.floor(x+s),j=Math.floor(y+s),k=Math.floor(z+s),l=Math.floor(w+s),t=(i+j+k+l)*G4,X0=i-t,Y0=j-t,Z0=k-t,W0=l-t,x0=x-X0,y0=y-Y0,z0=z-Z0,w0=w-W0,c1=x0>y0?32:0,c2=x0>z0?16:0,c3=y0>z0?8:0,c4=x0>w0?4:0,c5=y0>w0?2:0,c6=z0>w0?1:0,c=c1+c2+c3+c4+c5+c6,i1=simplex[c][0]>=3?1:0,j1=simplex[c][1]>=3?1:0,k1=simplex[c][2]>=3?1:0,l1=simplex[c][3]>=3?1:0,i2=simplex[c][0]>=2?1:0,j2=simplex[c][1]>=2?1:0,k2=simplex[c][2]>=2?1:0,l2=simplex[c][3]>=2?1:0,i3=simplex[c][0]>=1?1:0,j3=simplex[c][1]>=1?1:0,k3=simplex[c][2]>=1?1:0,l3=simplex[c][3]>=1?1:0,x1=x0-i1+G4,y1=y0-j1+G4,z1=z0-k1+G4,w1=w0-l1+G4,x2=x0-i2+2*G4,y2=y0-j2+2*G4,z2=z0-k2+2*G4,w2=w0-l2+2*G4,x3=x0-i3+3*G4,y3=y0-j3+3*G4,z3=z0-k3+3*G4,w3=w0-l3+3*G4,x4=x0-1+4*G4,y4=y0-1+4*G4,z4=z0-1+4*G4,w4=w0-1+4*G4,ii=i&255,jj=j&255,kk=k&255,ll=l&255,gi0=perm[ii+perm[jj+perm[kk+perm[ll]]]]%32,gi1=perm[ii+i1+perm[jj+j1+perm[kk+k1+perm[ll+l1]]]]%32,gi2=perm[ii+i2+perm[jj+j2+perm[kk+k2+perm[ll+l2]]]]%32,gi3=perm[ii+i3+perm[jj+j3+perm[kk+k3+perm[ll+l3]]]]%32,gi4=perm[ii+1+perm[jj+1+perm[kk+1+perm[ll+1]]]]%32,t0=.6-x0*x0-y0*y0-z0*z0-w0*w0;t0<0?n0=0:(t0*=t0,n0=t0*t0*this.dot4(grad4[gi0],x0,y0,z0,w0));let t1=.6-x1*x1-y1*y1-z1*z1-w1*w1;t1<0?n1=0:(t1*=t1,n1=t1*t1*this.dot4(grad4[gi1],x1,y1,z1,w1));let t2=.6-x2*x2-y2*y2-z2*z2-w2*w2;t2<0?n2=0:(t2*=t2,n2=t2*t2*this.dot4(grad4[gi2],x2,y2,z2,w2));let t3=.6-x3*x3-y3*y3-z3*z3-w3*w3;t3<0?n3=0:(t3*=t3,n3=t3*t3*this.dot4(grad4[gi3],x3,y3,z3,w3));let t4=.6-x4*x4-y4*y4-z4*z4-w4*w4;return t4<0?n4=0:(t4*=t4,n4=t4*t4*this.dot4(grad4[gi4],x4,y4,z4,w4)),27*(n0+n1+n2+n3+n4)}};var SSAOShader={name:"SSAOShader",defines:{PERSPECTIVE_CAMERA:1,KERNEL_SIZE:32},uniforms:{tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},kernel:{value:null},cameraNear:{value:null},cameraFar:{value:null},resolution:{value:new Vector2},cameraProjectionMatrix:{value:new Matrix4},cameraInverseProjectionMatrix:{value:new Matrix4},kernelRadius:{value:8},minDistance:{value:.005},maxDistance:{value:.05}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
		uniform highp sampler2D tNormal;
		uniform highp sampler2D tDepth;
		uniform sampler2D tNoise;

		uniform vec3 kernel[ KERNEL_SIZE ];

		uniform vec2 resolution;

		uniform float cameraNear;
		uniform float cameraFar;
		uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraInverseProjectionMatrix;

		uniform float kernelRadius;
		uniform float minDistance; // avoid artifacts caused by neighbour fragments with minimal depth difference
		uniform float maxDistance; // avoid the influence of fragments which are too far away

		varying vec2 vUv;

		#include <packing>

		float getDepth( const in vec2 screenPosition ) {

			return texture2D( tDepth, screenPosition ).x;

		}

		float getLinearDepth( const in vec2 screenPosition ) {

			#if PERSPECTIVE_CAMERA == 1

				float fragCoordZ = texture2D( tDepth, screenPosition ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );

			#else

				return texture2D( tDepth, screenPosition ).x;

			#endif

		}

		float getViewZ( const in float depth ) {

			#if PERSPECTIVE_CAMERA == 1

				return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );

			#else

				return orthographicDepthToViewZ( depth, cameraNear, cameraFar );

			#endif

		}

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth, const in float viewZ ) {

			float clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];

			vec4 clipPosition = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );

			clipPosition *= clipW; // unprojection.

			return ( cameraInverseProjectionMatrix * clipPosition ).xyz;

		}

		vec3 getViewNormal( const in vec2 screenPosition ) {

			return unpackRGBToNormal( texture2D( tNormal, screenPosition ).xyz );

		}

		void main() {

			float depth = getDepth( vUv );

			if ( depth == 1.0 ) {

				gl_FragColor = vec4( 1.0 ); // don't influence background
				
			} else {

				float viewZ = getViewZ( depth );

				vec3 viewPosition = getViewPosition( vUv, depth, viewZ );
				vec3 viewNormal = getViewNormal( vUv );

				vec2 noiseScale = vec2( resolution.x / 4.0, resolution.y / 4.0 );
				vec3 random = vec3( texture2D( tNoise, vUv * noiseScale ).r );

				// compute matrix used to reorient a kernel vector

				vec3 tangent = normalize( random - viewNormal * dot( random, viewNormal ) );
				vec3 bitangent = cross( viewNormal, tangent );
				mat3 kernelMatrix = mat3( tangent, bitangent, viewNormal );

				float occlusion = 0.0;

				for ( int i = 0; i < KERNEL_SIZE; i ++ ) {

					vec3 sampleVector = kernelMatrix * kernel[ i ]; // reorient sample vector in view space
					vec3 samplePoint = viewPosition + ( sampleVector * kernelRadius ); // calculate sample point

					vec4 samplePointNDC = cameraProjectionMatrix * vec4( samplePoint, 1.0 ); // project point and calculate NDC
					samplePointNDC /= samplePointNDC.w;

					vec2 samplePointUv = samplePointNDC.xy * 0.5 + 0.5; // compute uv coordinates

					float realDepth = getLinearDepth( samplePointUv ); // get linear depth from depth texture
					float sampleDepth = viewZToOrthographicDepth( samplePoint.z, cameraNear, cameraFar ); // compute linear depth of the sample view Z value
					float delta = sampleDepth - realDepth;

					if ( delta > minDistance && delta < maxDistance ) { // if fragment is before sample point, increase occlusion

						occlusion += 1.0;

					}

				}

				occlusion = clamp( occlusion / float( KERNEL_SIZE ), 0.0, 1.0 );

				gl_FragColor = vec4( vec3( 1.0 - occlusion ), 1.0 );

			}

		}`},SSAODepthShader={name:"SSAODepthShader",defines:{PERSPECTIVE_CAMERA:1},uniforms:{tDepth:{value:null},cameraNear:{value:null},cameraFar:{value:null}},vertexShader:`varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`uniform sampler2D tDepth;

		uniform float cameraNear;
		uniform float cameraFar;

		varying vec2 vUv;

		#include <packing>

		float getLinearDepth( const in vec2 screenPosition ) {

			#if PERSPECTIVE_CAMERA == 1

				float fragCoordZ = texture2D( tDepth, screenPosition ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );

			#else

				return texture2D( tDepth, screenPosition ).x;

			#endif

		}

		void main() {

			float depth = getLinearDepth( vUv );
			gl_FragColor = vec4( vec3( 1.0 - depth ), 1.0 );

		}`},SSAOBlurShader={name:"SSAOBlurShader",uniforms:{tDiffuse:{value:null},resolution:{value:new Vector2}},vertexShader:`varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`uniform sampler2D tDiffuse;

		uniform vec2 resolution;

		varying vec2 vUv;

		void main() {

			vec2 texelSize = ( 1.0 / resolution );
			float result = 0.0;

			for ( int i = - 2; i <= 2; i ++ ) {

				for ( int j = - 2; j <= 2; j ++ ) {

					vec2 offset = ( vec2( float( i ), float( j ) ) ) * texelSize;
					result += texture2D( tDiffuse, vUv + offset ).r;

				}

			}

			gl_FragColor = vec4( vec3( result / ( 5.0 * 5.0 ) ), 1.0 );

		}`};var SSAOPass=class _SSAOPass extends Pass{constructor(scene,camera,width,height,kernelSize=32){super(),this.width=width!==void 0?width:512,this.height=height!==void 0?height:512,this.clear=!0,this.needsSwap=!1,this.camera=camera,this.scene=scene,this.kernelRadius=8,this.kernel=[],this.noiseTexture=null,this.output=0,this.minDistance=.005,this.maxDistance=.1,this._visibilityCache=new Map,this.generateSampleKernel(kernelSize),this.generateRandomKernelRotations();let depthTexture=new DepthTexture;depthTexture.format=DepthStencilFormat,depthTexture.type=UnsignedInt248Type,this.normalRenderTarget=new WebGLRenderTarget(this.width,this.height,{minFilter:NearestFilter,magFilter:NearestFilter,type:HalfFloatType,depthTexture}),this.ssaoRenderTarget=new WebGLRenderTarget(this.width,this.height,{type:HalfFloatType}),this.blurRenderTarget=this.ssaoRenderTarget.clone(),this.ssaoMaterial=new ShaderMaterial({defines:Object.assign({},SSAOShader.defines),uniforms:UniformsUtils.clone(SSAOShader.uniforms),vertexShader:SSAOShader.vertexShader,fragmentShader:SSAOShader.fragmentShader,blending:NoBlending}),this.ssaoMaterial.defines.KERNEL_SIZE=kernelSize,this.ssaoMaterial.uniforms.tNormal.value=this.normalRenderTarget.texture,this.ssaoMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture,this.ssaoMaterial.uniforms.tNoise.value=this.noiseTexture,this.ssaoMaterial.uniforms.kernel.value=this.kernel,this.ssaoMaterial.uniforms.cameraNear.value=this.camera.near,this.ssaoMaterial.uniforms.cameraFar.value=this.camera.far,this.ssaoMaterial.uniforms.resolution.value.set(this.width,this.height),this.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(this.camera.projectionMatrixInverse),this.normalMaterial=new MeshNormalMaterial,this.normalMaterial.blending=NoBlending,this.blurMaterial=new ShaderMaterial({defines:Object.assign({},SSAOBlurShader.defines),uniforms:UniformsUtils.clone(SSAOBlurShader.uniforms),vertexShader:SSAOBlurShader.vertexShader,fragmentShader:SSAOBlurShader.fragmentShader}),this.blurMaterial.uniforms.tDiffuse.value=this.ssaoRenderTarget.texture,this.blurMaterial.uniforms.resolution.value.set(this.width,this.height),this.depthRenderMaterial=new ShaderMaterial({defines:Object.assign({},SSAODepthShader.defines),uniforms:UniformsUtils.clone(SSAODepthShader.uniforms),vertexShader:SSAODepthShader.vertexShader,fragmentShader:SSAODepthShader.fragmentShader,blending:NoBlending}),this.depthRenderMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture,this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this.copyMaterial=new ShaderMaterial({uniforms:UniformsUtils.clone(CopyShader.uniforms),vertexShader:CopyShader.vertexShader,fragmentShader:CopyShader.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blendSrc:DstColorFactor,blendDst:ZeroFactor,blendEquation:AddEquation,blendSrcAlpha:DstAlphaFactor,blendDstAlpha:ZeroFactor,blendEquationAlpha:AddEquation}),this.fsQuad=new FullScreenQuad(null),this.originalClearColor=new Color}dispose(){this.normalRenderTarget.dispose(),this.ssaoRenderTarget.dispose(),this.blurRenderTarget.dispose(),this.normalMaterial.dispose(),this.blurMaterial.dispose(),this.copyMaterial.dispose(),this.depthRenderMaterial.dispose(),this.fsQuad.dispose()}render(renderer,writeBuffer,readBuffer){switch(this.overrideVisibility(),this.renderOverride(renderer,this.normalMaterial,this.normalRenderTarget,7829503,1),this.restoreVisibility(),this.ssaoMaterial.uniforms.kernelRadius.value=this.kernelRadius,this.ssaoMaterial.uniforms.minDistance.value=this.minDistance,this.ssaoMaterial.uniforms.maxDistance.value=this.maxDistance,this.renderPass(renderer,this.ssaoMaterial,this.ssaoRenderTarget),this.renderPass(renderer,this.blurMaterial,this.blurRenderTarget),this.output){case _SSAOPass.OUTPUT.SSAO:this.copyMaterial.uniforms.tDiffuse.value=this.ssaoRenderTarget.texture,this.copyMaterial.blending=NoBlending,this.renderPass(renderer,this.copyMaterial,this.renderToScreen?null:readBuffer);break;case _SSAOPass.OUTPUT.Blur:this.copyMaterial.uniforms.tDiffuse.value=this.blurRenderTarget.texture,this.copyMaterial.blending=NoBlending,this.renderPass(renderer,this.copyMaterial,this.renderToScreen?null:readBuffer);break;case _SSAOPass.OUTPUT.Depth:this.renderPass(renderer,this.depthRenderMaterial,this.renderToScreen?null:readBuffer);break;case _SSAOPass.OUTPUT.Normal:this.copyMaterial.uniforms.tDiffuse.value=this.normalRenderTarget.texture,this.copyMaterial.blending=NoBlending,this.renderPass(renderer,this.copyMaterial,this.renderToScreen?null:readBuffer);break;case _SSAOPass.OUTPUT.Default:this.copyMaterial.uniforms.tDiffuse.value=this.blurRenderTarget.texture,this.copyMaterial.blending=CustomBlending,this.renderPass(renderer,this.copyMaterial,this.renderToScreen?null:readBuffer);break;default:console.warn("THREE.SSAOPass: Unknown output type.")}}renderPass(renderer,passMaterial,renderTarget,clearColor,clearAlpha){renderer.getClearColor(this.originalClearColor);let originalClearAlpha=renderer.getClearAlpha(),originalAutoClear=renderer.autoClear;renderer.setRenderTarget(renderTarget),renderer.autoClear=!1,clearColor!=null&&(renderer.setClearColor(clearColor),renderer.setClearAlpha(clearAlpha||0),renderer.clear()),this.fsQuad.material=passMaterial,this.fsQuad.render(renderer),renderer.autoClear=originalAutoClear,renderer.setClearColor(this.originalClearColor),renderer.setClearAlpha(originalClearAlpha)}renderOverride(renderer,overrideMaterial,renderTarget,clearColor,clearAlpha){renderer.getClearColor(this.originalClearColor);let originalClearAlpha=renderer.getClearAlpha(),originalAutoClear=renderer.autoClear;renderer.setRenderTarget(renderTarget),renderer.autoClear=!1,clearColor=overrideMaterial.clearColor||clearColor,clearAlpha=overrideMaterial.clearAlpha||clearAlpha,clearColor!=null&&(renderer.setClearColor(clearColor),renderer.setClearAlpha(clearAlpha||0),renderer.clear()),this.scene.overrideMaterial=overrideMaterial,renderer.render(this.scene,this.camera),this.scene.overrideMaterial=null,renderer.autoClear=originalAutoClear,renderer.setClearColor(this.originalClearColor),renderer.setClearAlpha(originalClearAlpha)}setSize(width,height){this.width=width,this.height=height,this.ssaoRenderTarget.setSize(width,height),this.normalRenderTarget.setSize(width,height),this.blurRenderTarget.setSize(width,height),this.ssaoMaterial.uniforms.resolution.value.set(width,height),this.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(this.camera.projectionMatrixInverse),this.blurMaterial.uniforms.resolution.value.set(width,height)}generateSampleKernel(kernelSize){let kernel=this.kernel;for(let i=0;i<kernelSize;i++){let sample=new Vector3;sample.x=Math.random()*2-1,sample.y=Math.random()*2-1,sample.z=Math.random(),sample.normalize();let scale=i/kernelSize;scale=MathUtils.lerp(.1,1,scale*scale),sample.multiplyScalar(scale),kernel.push(sample)}}generateRandomKernelRotations(){let simplex=new SimplexNoise,size=16,data=new Float32Array(size);for(let i=0;i<size;i++){let x=Math.random()*2-1,y=Math.random()*2-1,z=0;data[i]=simplex.noise3d(x,y,z)}this.noiseTexture=new DataTexture(data,4,4,RedFormat,FloatType),this.noiseTexture.wrapS=RepeatWrapping,this.noiseTexture.wrapT=RepeatWrapping,this.noiseTexture.needsUpdate=!0}overrideVisibility(){let scene=this.scene,cache=this._visibilityCache;scene.traverse(function(object){cache.set(object,object.visible),(object.isPoints||object.isLine)&&(object.visible=!1)})}restoreVisibility(){let scene=this.scene,cache=this._visibilityCache;scene.traverse(function(object){let visible=cache.get(object);object.visible=visible}),cache.clear()}};SSAOPass.OUTPUT={Default:0,SSAO:1,Blur:2,Depth:3,Normal:4};export{SSAOPass};
