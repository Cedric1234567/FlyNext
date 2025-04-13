//src/components/ui/CheckboxGroup.tsx
import React from 'react';

interface CheckboxGroupProps {
    options: { id: string; label: string }[];
    selectedValues: string[];
    onChange: (selected: string[]) => void;
    title?: string; // Optional title for the group
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ 
    options, 
    selectedValues, 
    onChange,
    title 
}) => {
    const [selected, setSelected] = React.useState<string[]>(selectedValues || []);

    const toggleOption = (optionId: string) => {
        if (selected.includes(optionId)) {
            setSelected(selected.filter((item) => item !== optionId));
        } else {
            setSelected([...selected, optionId]);
        }
    };

    React.useEffect(() => {
        onChange(selected);
    }, [selected, onChange]);

    return (
        <div className="checkbox-group">
            {title && <h4 className="checkbox-group-title">{title}</h4>}
            <div className="checkbox-options">
                {options.map((option) => (
                    <label key={option.id} className="checkbox-label">
                        <div className="checkbox-container">
                            <input
                                type="checkbox"
                                value={option.id}
                                checked={selected.includes(option.id)}
                                onChange={() => toggleOption(option.id)}
                                className="checkbox-input"
                            />
                            <span className="checkbox-custom"></span>
                        </div>
                        <span className="checkbox-text">{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default CheckboxGroup;