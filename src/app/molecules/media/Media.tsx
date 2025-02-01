import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Media.scss';

import encrypt from 'matrix-encrypt-attachment';

import { BlurhashCanvas } from 'react-blurhash';
import Text from '../../atoms/text/Text';
import IconButton from '../../atoms/button/IconButton';
import Spinner from '../../atoms/spinner/Spinner';
import ImageLightbox from '../image-lightbox/ImageLightbox';

import DownloadSVG from '../../../../public/res/ic/outlined/download.svg';
import ExternalSVG from '../../../../public/res/ic/outlined/external.svg';
import PlaySVG from '../../../../public/res/ic/outlined/play.svg';

import { getBlobSafeMimeType } from '../../../util/mimetypes';
import initMatrix from '../../../client/initMatrix';
import settings from '../../../client/state/settings';

async function getDecryptedBlob(
  response: Response,
  type: string,
  decryptData: encrypt.IEncryptedFile,
) {
  const arrayBuffer = await response.arrayBuffer();
  const dataArray = await encrypt.decryptAttachment(arrayBuffer, decryptData);
  const blob = new Blob([dataArray], { type: getBlobSafeMimeType(type) });
  return blob;
}

const cachedUnencryptedMedia = new Map<string, string | Promise<string>>();

export async function getUrl(
  link: string,
  contentType?: string,
  decryptionData?: encrypt.IEncryptedFile,
): Promise<string> {
  try {
    // make sure the link is the homeserver we expect
    if (!link.startsWith(initMatrix.matrixClient.getHomeserverUrl())) {
      console.error(
        "got media link to unexpected homeserver, aborting so we don't send them our token",
        link,
      );
      return link;
    }

    if (cachedUnencryptedMedia.has(link)) {
      const cachedValue = cachedUnencryptedMedia.get(link);
      if (typeof cachedValue === 'string') return cachedValue;
      const res = (await cachedValue)!;
      return res;
    }

    // insert a promise
    let resolvePromise: undefined | ((_value: string) => void);
    const promise = new Promise<string>((resolve: (_value: string) => void) => {
      resolvePromise = resolve;
    });
    cachedUnencryptedMedia.set(link, promise);
    if (cachedUnencryptedMedia.size > 10000) {
      console.info('cachedUnencryptedMedia is too large, clearing');
      // remove everything except the promises
      cachedUnencryptedMedia.entries().forEach(([key, value]) => {
        if (typeof value === 'string') {
          cachedUnencryptedMedia.delete(key);
        }
      });
    }

    const response = await fetch(link, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${initMatrix.matrixClient.getAccessToken()}`,
      },
    });
    if (decryptionData) {
      if (!contentType) {
        throw new Error('Cannot decrypt media without a content type');
      }
      const objectUrl = URL.createObjectURL(
        await getDecryptedBlob(response, contentType, decryptionData),
      );
      cachedUnencryptedMedia.set(link, objectUrl);
      resolvePromise?.(objectUrl);
      return objectUrl;
    }
    const blob = await response.blob();
    const objectUrl: string = URL.createObjectURL(blob);
    cachedUnencryptedMedia.set(link, objectUrl);
    resolvePromise?.(objectUrl);
    return objectUrl;
  } catch (e) {
    console.error(e);
    return link;
  }
}

function getNativeHeight(width, height, maxWidth = 296) {
  const scale = maxWidth / width;
  return scale * height;
}

function FileHeader({ name, link = null, external = false, file = null, type }) {
  const [url, setUrl] = useState(null);

  async function getFile() {
    const myUrl = await getUrl(link, type, file);
    setUrl(myUrl);
  }

  async function handleDownload(e) {
    if (file !== null && url === null) {
      e.preventDefault();
      await getFile();
      e.target.click();
    }
  }
  return (
    <div className="file-header">
      <Text className="file-name" variant="b3">
        {name}
      </Text>
      {link !== null && (
        <>
          {external && (
            <IconButton
              size="extra-small"
              tooltip="Open in new tab"
              src={ExternalSVG}
              onClick={() => window.open(url || link)}
            />
          )}
          <a href={url || link} download={name} target="_blank" rel="noreferrer">
            <IconButton
              size="extra-small"
              tooltip="Download"
              src={DownloadSVG}
              onClick={handleDownload}
            />
          </a>
        </>
      )}
    </div>
  );
}
FileHeader.propTypes = {
  name: PropTypes.string.isRequired,
  link: PropTypes.string,
  external: PropTypes.bool,
  file: PropTypes.shape({}),
  type: PropTypes.string.isRequired,
};

function File({ name, link, file = null, type = '' }) {
  return (
    <div className="file-container">
      <FileHeader name={name} link={link} file={file} type={type} />
    </div>
  );
}

File.propTypes = {
  name: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  type: PropTypes.string,
  file: PropTypes.shape({}),
};

function Image({
  name,
  width,
  height,
  link,
  file = null,
  type,
  blurhash = '',
}: {
  name: string;
  width: number;
  height: number;
  link: string;
  file: unknown;
  type: string;
  blurhash: string;
}) {
  const [url, setUrl] = useState(null);
  const [blur, setBlur] = useState(true);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    let unmounted = false;
    async function fetchUrl() {
      const myUrl = await getUrl(link, type, file);
      if (unmounted) return;
      setUrl(myUrl);
    }
    fetchUrl();
    return () => {
      unmounted = true;
    };
  }, [file, link, type]);

  const toggleLightbox = () => {
    if (!url) return;
    setLightbox(!lightbox);
  };

  return (
    <>
      <div className="file-container">
        <div
          style={{ height: width !== null ? getNativeHeight(width, height) : 'unset' }}
          className="image-container"
          role="button"
          tabIndex={0}
          onClick={toggleLightbox}
          onKeyDown={toggleLightbox}
        >
          {blurhash && blur && <BlurhashCanvas hash={blurhash} punch={1} width={32} height={32} />}
          {url !== null && (
            <img
              style={{ display: blur ? 'none' : 'unset' }}
              onLoad={() => setBlur(false)}
              src={url || link}
              alt={name}
            />
          )}
        </div>
      </div>
      {url && (
        <ImageLightbox url={url} alt={name} isOpen={lightbox} onRequestClose={toggleLightbox} />
      )}
    </>
  );
}
Image.propTypes = {
  name: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  link: PropTypes.string.isRequired,
  file: PropTypes.shape({}),
  type: PropTypes.string,
  blurhash: PropTypes.string,
};

function Sticker({ name, height = null, width = null, link, file = null, type = '' }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let unmounted = false;
    async function fetchUrl() {
      const myUrl = await getUrl(link, type, file);
      if (unmounted) return;
      setUrl(myUrl);
    }
    fetchUrl();
    return () => {
      unmounted = true;
    };
  }, []);

  return (
    <div
      className="sticker-container"
      style={{ height: width !== null ? getNativeHeight(width, height, 128) : 'unset' }}
    >
      {url !== null && <img src={url || link} title={name} alt={name} />}
    </div>
  );
}
Sticker.propTypes = {
  name: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  link: PropTypes.string.isRequired,
  file: PropTypes.shape({}),
  type: PropTypes.string,
};

function Audio({ name, link, type = '', file = null }) {
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState(null);

  async function loadAudio() {
    const myUrl = await getUrl(link, type, file);
    setUrl(myUrl);
    setIsLoading(false);
  }
  function handlePlayAudio() {
    setIsLoading(true);
    loadAudio();
  }

  return (
    <div className="file-container">
      <FileHeader name={name} link={file !== null ? url : url || link} type={type} external />
      <div className="audio-container">
        {url === null && isLoading && <Spinner size="small" />}
        {url === null && !isLoading && (
          <IconButton onClick={handlePlayAudio} tooltip="Play audio" src={PlaySVG} />
        )}
        {url !== null && (
          /* eslint-disable-next-line jsx-a11y/media-has-caption */
          <audio autoPlay controls>
            <source src={url} type={getBlobSafeMimeType(type)} />
          </audio>
        )}
      </div>
    </div>
  );
}
Audio.propTypes = {
  name: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  type: PropTypes.string,
  file: PropTypes.shape({}),
};

function Video({
  name,
  link,
  thumbnail = null,
  thumbnailFile = null,
  thumbnailType = null,
  width = null,
  height = null,
  file = null,
  type = '',
  blurhash = null,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState(null);
  const [thumbUrl, setThumbUrl] = useState(null);
  const [blur, setBlur] = useState(true);

  useEffect(() => {
    let unmounted = false;
    async function fetchUrl() {
      const myThumbUrl = await getUrl(thumbnail, thumbnailType, thumbnailFile);
      if (unmounted) return;
      setThumbUrl(myThumbUrl);
    }
    if (thumbnail !== null) fetchUrl();
    return () => {
      unmounted = true;
    };
  }, []);

  const loadVideo = async () => {
    const myUrl = await getUrl(link, type, file);
    setUrl(myUrl);
    setIsLoading(false);
  };

  const handlePlayVideo = () => {
    setIsLoading(true);
    loadVideo();
  };

  return (
    <div className="file-container">
      <FileHeader name={name} link={file !== null ? url : url || link} type={type} external />
      <div
        style={{
          height: width !== null ? getNativeHeight(width, height) : 'unset',
        }}
        className="video-container"
      >
        {url === null ? (
          <>
            {blurhash && blur && (
              <BlurhashCanvas hash={blurhash} punch={1} width={32} height={32} />
            )}
            {thumbUrl !== null && (
              <img
                style={{ display: blur ? 'none' : 'unset' }}
                src={thumbUrl}
                onLoad={() => setBlur(false)}
                alt={name}
              />
            )}
            {isLoading && <Spinner size="small" />}
            {!isLoading && (
              <IconButton onClick={handlePlayVideo} tooltip="Play video" src={PlaySVG} />
            )}
          </>
        ) : (
          /* eslint-disable-next-line jsx-a11y/media-has-caption */
          <video autoPlay controls poster={thumbUrl}>
            <source src={url} type={getBlobSafeMimeType(type)} />
          </video>
        )}
      </div>
    </div>
  );
}
Video.propTypes = {
  name: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  thumbnail: PropTypes.string,
  thumbnailFile: PropTypes.shape({}),
  thumbnailType: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  file: PropTypes.shape({}),
  type: PropTypes.string,
  blurhash: PropTypes.string,
};

function IframePlayer({ children, link, sitename, title, thumbnail }) {
  const [videoStarted, setVideoStarted] = useState(false);

  const handlePlayVideo = () => {
    setVideoStarted(true);
  };

  return (
    <div className="iframeplayer">
      <div className="file-container">
        <div className="file-header">
          <Text className="file-name" variant="b3">{`${sitename} - ${title}`}</Text>

          <IconButton
            size="extra-small"
            tooltip="Open in new tab"
            src={ExternalSVG}
            onClick={() => window.open(link)}
          />
        </div>

        <div className="video-container">
          {videoStarted ? (
            <div>{children}</div>
          ) : (
            <>
              <img src={thumbnail} alt={`${sitename} thumbnail`} />
              <IconButton onClick={handlePlayVideo} tooltip="Play video" src={PlaySVG} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
IframePlayer.propTypes = {
  children: PropTypes.node.isRequired,
  link: PropTypes.string.isRequired,
  sitename: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  thumbnail: PropTypes.string.isRequired,
};

function Embed({ link }) {
  const url = new URL(link);

  if (
    settings.showYoutubeEmbedPlayer &&
    (((url.host === 'www.youtube.com' || url.host === 'youtube.com') &&
      (url.pathname === '/watch' || url.pathname.startsWith('/shorts/'))) ||
      url.host === 'youtu.be' ||
      url.host === 'www.youtu.be')
  ) {
    return <YoutubeEmbed link={link} />;
  }

  const [urlPreviewInfo, setUrlPreviewInfo] = useState();
  const mx = initMatrix.matrixClient;

  useEffect(() => {
    let unmounted = false;

    async function getUrlPreview() {
      try {
        const info = await mx.getUrlPreview(link, 0);
        if (unmounted) return;
        setUrlPreviewInfo(info);
      } catch {
        setUrlPreviewInfo();
      }
    }

    getUrlPreview();

    return () => {
      unmounted = true;
    };
  });

  if (urlPreviewInfo != null) {
    const imageURL = urlPreviewInfo['og:image'] || urlPreviewInfo['og:image:secure_url'];
    const image =
      imageURL != null ? (
        <Image
          link={mx.mxcUrlToHttp(imageURL)}
          height={
            urlPreviewInfo['og:image:height'] != null
              ? parseInt(urlPreviewInfo['og:image:height'], 10)
              : null
          }
          width={
            urlPreviewInfo['og:image:width'] != null
              ? parseInt(urlPreviewInfo['og:image:width'], 10)
              : null
          }
          name={urlPreviewInfo['og:image:alt'] || urlPreviewInfo['og:site_name'] || ''}
          type={urlPreviewInfo['og:image:type'] != null ? urlPreviewInfo['og:image:type'] : null}
        />
      ) : null;

    // Image only embed
    if (
      image != null &&
      urlPreviewInfo['og:title'] == null &&
      urlPreviewInfo['og:description'] == null
    ) {
      return (
        <div className="embed-container">
          <div className="file-container">{image}</div>
        </div>
      );
    }

    const embedTitle = urlPreviewInfo['og:title'] || urlPreviewInfo['og:site_name'];

    return (
      <div className="embed-container">
        <div className="file-container embed">
          <div className="embed-text">
            {embedTitle != null && (
              <Text className="embed-title" variant="h2">
                {embedTitle}
              </Text>
            )}

            {urlPreviewInfo['og:description'] != null && (
              <Text className="embed-description" variant="b3">
                {urlPreviewInfo['og:description']}
              </Text>
            )}
          </div>

          <div className="embed-media">{image}</div>
        </div>
      </div>
    );
  }

  return null;
}
Embed.propTypes = {
  link: PropTypes.string.isRequired,
};

function YoutubeEmbed({ link }) {
  const [urlPreviewInfo, setUrlPreviewInfo] = useState(null);
  const mx = initMatrix.matrixClient;
  const url = new URL(link);

  // fix for no embed information on www.youtu.be
  if (url.host === 'www.youtu.be') {
    url.host = 'youtu.be';
  }

  useEffect(() => {
    let unmounted = false;

    async function getThumbnail() {
      const info = await mx.getUrlPreview(url.toString(), 0);
      if (unmounted) return;

      setUrlPreviewInfo(info);
    }

    getThumbnail();

    return () => {
      unmounted = true;
    };
  });

  let videoID;
  if (url.host === 'youtu.be' || url.host === 'www.youtu.be') {
    videoID = url.pathname.slice(1);
  } else if (url.pathname.startsWith('/shorts/')) {
    videoID = url.pathname.slice(8);
  } else {
    videoID = url.searchParams.get('v');
  }

  let embedURL = `https://www.youtube-nocookie.com/embed/${videoID}?autoplay=1`;
  if (url.searchParams.has('t')) {
    // timestamp flag
    embedURL += `&start=${url.searchParams.get('t')}`;
  }

  if (urlPreviewInfo !== null) {
    return (
      <div className="embed-container">
        <IframePlayer
          link={link}
          sitename="YouTube"
          title={urlPreviewInfo['og:title']}
          thumbnail={mx.mxcUrlToHttp(urlPreviewInfo['og:image'])}
        >
          <iframe
            src={embedURL}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </IframePlayer>
      </div>
    );
  }

  return null;
}
YoutubeEmbed.propTypes = {
  link: PropTypes.string.isRequired,
};

export { File, Image, Sticker, Audio, Video, YoutubeEmbed, Embed, IframePlayer };
