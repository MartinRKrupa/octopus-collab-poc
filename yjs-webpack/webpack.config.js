module.exports = {
    mode: "development",
    devtool: "source-map",
    experiments: { asyncWebAssembly: true },
    performance: {       // we dont want the wasm blob to generate warnings
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env',
                            '@babel/preset-typescript'
                        ]
                    }
                },
                exclude: /node_modules/
            }
        ]
    }
};