import { Button } from "./ui/button";

interface StreamingIconProps {
  name: string;
  icon: string;
  link: string;
}

export function StreamingIcon({ name, icon, link }: StreamingIconProps) {
  return (
    <Button
      variant="outline"
      className="flex flex-col items-center justify-center h-20 w-20 p-2"
      onClick={() => window.open(link, '_blank')}
    >
      <div className="w-10 h-10 mb-1 flex items-center justify-center">
        <img src={icon} alt={name} className="w-full h-full object-contain" />
      </div>
      <span className="text-xs">{name}</span>
    </Button>
  );
}
