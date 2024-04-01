import { FaFileUpload, FaFileImport, FaFileExport } from "react-icons/fa";
import N64Graphics, { Color, N64Codec, N64IMode } from '../n64/n64graphics';
import GlobalState from "../state";

function PromptFile(e) {
    e.preventDefault();
    document.getElementById('hpicker').click();
    let picker = document.getElementById('hpicker');
    picker.addEventListener('change', (e) => {
        let file = (e.target as HTMLInputElement).files[0];
        let reader = new FileReader();
        reader.onload = (e) => {
            GlobalState.setBuffer(new Uint8Array(reader.result as ArrayBuffer));
        }
        reader.readAsArrayBuffer(file);
    });
}

export function Header() {
	return (
		<div className="header">
            <img className="logo" src="https://cdn.discordapp.com/emojis/772160836244209694.webp?size=96&quality=lossless" alt="N64 Logo" width="32" height="32"/>
            <div className="btn" onClick={PromptFile}>
                <FaFileUpload size={15}/>
                <span>Open</span>
            </div>
            <div className="btn" onClick={(e) => {
                alert('Not implemented yet!');
            }}>
                <FaFileImport size={15}/>
                <span>Insert</span>
            </div>
            <div className="btn" onClick={(e) => {
                alert('Not implemented yet!');
            }}>
                <FaFileExport size={15}/>
                <span>Save</span>
            </div>
            <div className="dropdown">
                <span>Codec</span>
                <select
                    title="Codec"
                    defaultValue={`${GlobalState.codec}`}
                    onChange={(e) => {
                        e.preventDefault();
                        GlobalState.setCodec(parseInt(e.currentTarget.value))
                    }}>
                    { N64Graphics.Codecs().map((codec: N64Codec) => <option value={codec}>{N64Graphics.CodecString(codec)}</option>) }
                </select>
            </div>
            <div className="dropdown">
                <span>Alpha</span>
                <select
                    title="Alpha"
                    defaultValue={`${GlobalState.mode}`}
                    onChange={(e) => {
                        e.preventDefault();
                        GlobalState.setMode(parseInt(e.currentTarget.value))
                    }}>
                    { N64Graphics.Modes().map((mode: N64IMode) => <option value={mode}>{N64Graphics.ModeString(mode)}</option>) }
                </select>
            </div>
            <div className="dropdown">
                <span>Scale</span>
                <select
                    title="Scale"
                    defaultValue={`${GlobalState.scale}`}
                    onChange={(e) => {
                        e.preventDefault();
                        GlobalState.setScale(parseInt(e.currentTarget.value))
                    }}>
                    { [1, 2, 3, 4, 5].map((scale: number) => <option value={scale}>{scale}x</option>) }
                </select>
            </div>
            <div className="dropdown">
                <span>Color</span>
                <input
                    title="Background"
                    type="color"
                    defaultValue={GlobalState.background.ToHexString()}
                    onChange={(e) => {
                        e.preventDefault();
                        GlobalState.setBackground(Color.FromHexString(e.currentTarget.value));
                    }}
                />
            </div>
        </div>
	);
}
