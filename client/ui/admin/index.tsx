import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { SongInfo } from '../../shared/types';
import styled from '@emotion/styled';

const SongRow = styled.tr`
    input[type=text] {
        width: 20vw;
    }
`;

interface SongProps {
    song: SongInfo;
    onChange: (song: Partial<SongInfo>) => void;
}

const Song = ({ song, onChange }: SongProps) => {
    const { fileName, enabled, songNames, uniqueNotes, totalNotes, duration } = song;
    const [updatedSongNames, setUpdatedSongNames] = useState<string>(songNames.join(','));
    useEffect(() => {
        setUpdatedSongNames(songNames.join(','));
    }, [songNames]);
    const toggle = async () => {
        await fetch(`/songs/${fileName}`, {
            method: 'PATCH', headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify({ enabled: !enabled }),
        });
        onChange({
            ...song,
            enabled: !enabled,
        });
    };
    const saveSongNames = (e: React.FormEvent) => {
        e.preventDefault();
        const doPatch = async () => {
        const cleaned = updatedSongNames.split(',').map(s => s.toLowerCase().trim());
            await fetch(`/songs/${fileName}`, {
                method: 'PATCH', headers: {
                    'Content-type': 'application/json',
                },
                body: JSON.stringify({ songNames: cleaned }),
            });
            onChange({
                ...song,
                songNames: cleaned,
            });
        }
        doPatch();
    };
    // TODO ability to manage song names
    return (<SongRow>
        <td><input type="checkbox" checked={enabled} onChange={toggle} id={fileName}/></td>
        <td><label htmlFor={fileName}>{fileName}</label></td>
        <td>{uniqueNotes}</td>
        <td>{totalNotes}</td>
        <td>{Math.floor(duration)}s</td>
        <td><form onSubmit={saveSongNames}><input type="text" value={updatedSongNames} onChange={(e) => {
            setUpdatedSongNames(e.target.value);
        }}/><input type="submit" value="save" disabled={updatedSongNames === songNames.join(',')}/></form></td>
    </SongRow>)
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
        const formData = new FormData();
        // @ts-ignore
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
        <table>
            <thead>
                <tr>
                    <th>enabled</th>
                    <th>file name</th>
                    <th># unique notes</th>
                    <th># total notes</th>
                    <th>duration</th>
                    <th>valid song names</th>
                </tr>
            </thead>
            <tbody>                
                {songs.map(s => <Song key={s.fileName} song={s} onChange={updateSong} />)}
            </tbody>
        </table>
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