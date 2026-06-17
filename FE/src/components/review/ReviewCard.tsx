// src/components/review/ReviewCard.tsx
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface ReviewCardProps {
  username: string;
  rating: number;
  review: string;
  createdAt: string; 
}

export function ReviewCard({
  username,
  rating,
  review,
  createdAt,
}: ReviewCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h4>{username}</h4>
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-4 h-4"
                fill={rating >= star ? "#eab308" : "none"}
                stroke={rating >= star ? "#eab308" : "currentColor"}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{review}</p>
      </CardContent>
    </Card>
  );
}