module.exports = {
    mode: "development",
    devtool: "source-map",
    experiments: { asyncWebAssembly: true },
    performance: {       // we dont want the wasm blob to generate warnings
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    }
};