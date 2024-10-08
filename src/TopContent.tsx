import React, { useState, useEffect } from "react";
import axios from "axios";
import GridDisplay from "./GridDisplay";

interface GridSize {
  x: number;
  y: number;
}

interface TopContentProps {
  accessToken: string;
  selectionType: string;
  gridSize: GridSize;
  includeProfilePicture: boolean;
  excludeNullImages: boolean;
  useGradient: boolean;
  color1: string;
  color2: string;
}

interface ContentInstance {
  images?: { url: string }[];
  album?: { images: { url: string }[] };
  external_urls?: { spotify: string };
  name: string;
}

const TopContent: React.FC<TopContentProps> = ({
  accessToken,
  selectionType,
  gridSize,
  includeProfilePicture,
  excludeNullImages,
  useGradient,
  color1,
  color2,
}) => {
  const [artistsCache, setArtistsCache] = useState<ContentInstance[]>([]);
  const [tracksCache, setTracksCache] = useState<ContentInstance[]>([]);
  const [content, setContent] = useState<ContentInstance[]>([]);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  useEffect(() => {
    const getTopContent = async () => {
      try {
        const totalItems = 99; // maximum items to request stored by the Spotify API

        // determine the content type and check if the cache exists
        const contentType =
          selectionType === "artists" ? "top-artists" : "top-tracks";
        let cachedData =
          selectionType === "artists" ? artistsCache : tracksCache;

        // if the cache has the full set of data already, use it, otherwise fetch the data
        let content: ContentInstance[] = cachedData.length === totalItems ? cachedData : [];

        if (content.length === 0) {
          const response = await axios.get(
            `http://localhost:8888/${contentType}`,
            {
              headers: {
                "x-token-key": accessToken,
              },
              params: {
                limit: totalItems,
              },
            }
          );

          console.log(
            `Successfully fetched top ${selectionType}:`,
            response.data
          );

          content = response.data;

          // cache the newly fetched content for subsequent requests
          if (selectionType === "artists") {
            setArtistsCache(content);
          } else if (selectionType === "tracks") {
            setTracksCache(content);
          }
        } else {
          console.log(`Using cached ${selectionType} data`);
        }

        // if the user wants to exclude null images, filter the content
        if (excludeNullImages) {
          console.log("Excluding null images");
          content = content.filter((item) => {
            // check for artists (item.images) and tracks (item.album?.images)
            const images =
              selectionType === "artists" ? item.images : item.album?.images;
            if (images && images.length > 0 && images[0].url) {
              return true; // keep items with valid images
            } else {
              console.log("Filtered out item due to missing image:", item);
              return false; // filter out items without valid images
            }
          });
        }

        // calculate how many items are needed for the grid and check if the content is sufficient for the desired grid size
        const totalGridItems = gridSize.x * gridSize.y;
        if (content.length < totalGridItems) {
          alert(
            `Only ${content.length} ${selectionType} available due to missing images. Please reduce the grid size.`
          );
        }

        // set the content to the filtered slice
        setContent(content.slice(0, totalGridItems));
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error fetching top ${selectionType}:`, error.message);
        } else {
          console.error(`Error fetching top ${selectionType}:`, error);
        }
      }
    };

    // fetch profile picture if the option is enabled
    const fetchProfilePicture = async () => {
      try {
        const response = await axios.get("http://localhost:8888/profile", {
          headers: {
            "x-token-key": accessToken,
          },
        });
        setProfilePictureUrl(response.data.profilePictureUrl);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error fetching profile picture:", error.message);
        } else {
          console.error("Error fetching profile picture:", error);
        }
      }
    };

    // only gets fetched when the user selects the option
    if (includeProfilePicture) {
      fetchProfilePicture();
    }

    // get the top content, content gets fetched regardless on every generation
    getTopContent();
  }, [
    accessToken,
    selectionType,
    gridSize,
    includeProfilePicture,
    excludeNullImages,
    artistsCache,
    tracksCache,
  ]);

  return (
    <div
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        minWidth: 0,
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>
        Your Top{" "}
        {selectionType.charAt(0).toUpperCase() + selectionType.slice(1)}
      </h1>
      {content.length > 0 && (
        <GridDisplay
          content={content}
          gridSize={gridSize}
          includeProfilePicture={includeProfilePicture}
          profilePictureUrl={profilePictureUrl}
          useGradient={useGradient}
          color1={color1}
          color2={color2}
        />
      )}
    </div>
  );
};

export default TopContent;