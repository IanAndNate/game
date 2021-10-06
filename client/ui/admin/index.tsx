import React, { FormEvent, useEffect, useRef, useState } from 'react';

interface SongInfo {
    fileName: string;
    enabled: boolean;
    songNames: string[];
}

interface SongProps {
    song: SongInfo;
    onChange: (song: SongInfo) => void;
}

const Song = ({ song: { fileName, enabled, songNames }, onChange }: SongProps) => {
    const toggle = async () => {
        await fetch(`/songs/${fileName}`, { 
            method: 'PATCH', headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify({ enabled: !enabled }),
        });
        onChange({
            fileName,
            enabled: !enabled,
            songNames,
        });
    }
    // TODO ability to manage song names
    return (<li>
        <input type="checkbox" checked={enabled} onChange={toggle} id={fileName}/>
        <label htmlFor={fileName}>{fileName} [{songNames.join(',')}]</label>
    </li>)
};

export const Admin = () => {
    const [songs, setSongs] = useState<SongInfo[]>([]);
    const [url, setUrl] = useState<string>('');
    const fileRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        const getSongs = async () => {
            const response = await fetch('/songs');
            setSongs(await response.json());
        }
        getSongs();
    }, []);
    const purge = async () => {
        await fetch('/songs', { method: 'DELETE' });
        setSongs([]);
    }
    const uploadSong = async (ev: React.ChangeEvent<HTMLInputElement>) => {
        console.log(ev.target.value);
        const formData = new FormData();
        [...ev.target.files].forEach(file => {
            formData.append('song', file, file.name);
        });
        const response = await fetch('/songs', { method: 'POST', body: formData });
        setSongs(await response.json());        
        ev.target.value = '';
    }
    const upload = () => {
        if (fileRef.current) {
            fileRef.current.click();
        }
    }
    const updateSong = (song: SongInfo) => {
        setSongs(songs.map(s => s.fileName === song.fileName ? song : s));
    }
    const fetchUrl = async (ev: FormEvent) => {
        ev.preventDefault();
        const response = await fetch(`/songs?${new URLSearchParams({ url })}`, {
            method: 'POST',
        });
        setSongs(await response.json());
    }
    return (<>
        <h3>Manage song list</h3>
        <ul>{songs.map(s => <Song key={s.fileName} song={s} onChange={updateSong} />)}</ul>
        <button onClick={purge}>unload all songs</button>
        <button onClick={upload}>upload MIDI files</button>
        <input ref={fileRef} style={{ display: 'none' }} type="file" id="song" name="song" onChange={uploadSong} multiple />
        <div>
            <form onSubmit={fetchUrl}>
                <input type="text" name="url" placeholder="https://.../file.mid" onChange={(e) => setUrl(e.target.value)} />
                <button type="submit" disabled={url.length < 8}>add MIDI from URL</button>
            </form>
        </div>
        <a href="/">go home</a>
    </>);
}