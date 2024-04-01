import { render } from 'preact';
import { Header } from './components/header';
import Provider from './listener';
import { useEffect, useRef, useState } from 'preact/hooks';
import { GraphicsViewer } from './components/viewer';
import GlobalState from './state';
import './main.css';

export function App() {
	const [_, setContext] = useState(0);
	const [customSize, setCustomSize] = useState([128, 128]);
	const [barSize, setBarSize] = useState([0, 0]);
	const viewers = [[64, 64], [32, 64], [64, 32], [32, 32], [16, 32], [16, 16], [8, 16], [8, 8]];
	const barRef = useRef(null);

	useEffect(() => {
       setBarSize([barRef.current.clientWidth, barRef.current.clientHeight - 30]);
    }, [barRef]);

	return (
		<Provider.Listener setState={setContext}>
			<div className="app">
				<input type="file" id="hpicker" title="hpicker" />
				<Header/>
				<div className="graphics">
					<div ref={barRef} className="bar">
						<span>Offset</span>
						<input
							title="Offset"
							type="text"
							id="offset"
							value={`0x${GlobalState.offset.toString(16).toUpperCase()}`}
							prefix={'0x'}
							onInput={(e) => {
								let oldVal = e.currentTarget.value.replace('0x', '');
								e.currentTarget.value = `0x${oldVal}`;
							}}
							onKeyUp={(e) => {
								let regEx = /^[0-9a-fA-F]+$/;
								let value = e.currentTarget.value.replace('0x', '');
								let isHex = regEx.test(value);

								if(!isHex) {
									return;
								}

								let num = parseInt(e.currentTarget.value, 16);

								if (isNaN(num)) {
									return;
								}

								GlobalState.setOffset(num);
								Provider.notify();
							}}
						/>
						<GraphicsViewer
							canvasId={`v:bar`}
							width={barSize[0]}
							height={barSize[1]}
							scale={1}
							hideSize={true}
						/>
					</div>
					<div className="viewers">
						{ viewers.map((v) =>
							<GraphicsViewer
								canvasId={`v:${viewers.indexOf(v)}`}
								width={v[0]}
								height={v[1]}
								scale={GlobalState.scale}
							/>
						)}
					</div>
					<div className="custom">
						<span id="ctitle">Custom</span>
						<input
							title="Custom Width"
							type="number"
							value={customSize[0]}
							onChange={(e) => {
								setCustomSize([parseInt(e.currentTarget.value), customSize[1]]);
								Provider.notify();
							}}
						/>
						<span id="csep">x</span>
						<input
							title="Custom Height"
							type="number"
							value={customSize[1]}
							onChange={(e) => {
								setCustomSize([customSize[0], parseInt(e.currentTarget.value)]);
								Provider.notify();
							}}
						/>
						<GraphicsViewer
							canvasId={`v:custom`}
							width={customSize[0]}
							height={customSize[1]}
							scale={GlobalState.scale}
							hideSize={true}
						/>
					</div>
				</div>
			</div>
		</Provider.Listener>
	);
}

render(<App />, document.getElementById('app'));
