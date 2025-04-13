// src/components/ui/RatingStar.tsx
import React from 'react';

interface RatingStarProps {
    rating: number | null;
    maxRating?: number;
    size?: number;
    color?: string;
    emptyColor?: string;
    onChange?: (rating: number) => void;
    readonly?: boolean;
    id?: string;
}

const RatingStar: React.FC<RatingStarProps> = ({
    rating,
    maxRating = 5,
    size = 24,
    color = '#FFD700', // gold
    emptyColor = '#D3D3D3', // light gray
    onChange,
    readonly = false,
}) => {
    const [hoverRating, setHoverRating] = React.useState(0);

    const handleClick = (selectedRating: number) => {
        if (!readonly && onChange) {
            onChange(selectedRating);
        }
    };

    const handleMouseEnter = (index: number) => {
        if (!readonly) {
            setHoverRating(index);
        }
    };

    const handleMouseLeave = () => {
        if (!readonly) {
            setHoverRating(0);
        }
    };

    return (
        <div className="rating-stars" style={{ display: 'flex' }}>
            {[...Array(maxRating)].map((_, index) => {
                const starValue = index + 1;
                const isFilled = hoverRating ? starValue <= hoverRating : rating !== null && starValue <= rating;

                return (
                    <div
                        key={index}
                        onClick={() => handleClick(starValue)}
                        onMouseEnter={() => handleMouseEnter(starValue)}
                        onMouseLeave={handleMouseLeave}
                        style={{
                            cursor: readonly ? 'default' : 'pointer',
                            width: size,
                            height: size,
                            display: 'inline-block',
                        }}
                    >
                        <svg
                            width={size}
                            height={size}
                            viewBox="0 0 24 24"
                            fill={isFilled ? color : emptyColor}
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                    </div>
                );
            })}
        </div>
    );
};

export default RatingStar;
