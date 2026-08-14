import { ArrowRight } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function ProjectList() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Projeto 01</CardTitle>
          <CardDescription className="line-clamp-2 leading-relaxed">
            A full-stack web application built with Next.js, TypeScript,
            Node.js, and PostgreSQL, focused on delivering a scalable and modern
            user experience. Implemented REST APIs, authentication, role-based
            access control, and database integration with a clean and
            maintainable architecture. Designed a responsive interface using
            React, Tailwind CSS, and shadcn/ui, with a strong focus on
            performance, usability, and code quality.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex items-center gap-1.5">
          <Avatar className="size-4">
            <AvatarImage src="https://github.com/fdanilosoares.png" />
            <AvatarFallback />
          </Avatar>

          <span className="text-muted-foreground text-xs">
            Created by{' '}
            <span className="text-foreground font-medium">Danilo Soares</span> a
            day ago
          </span>

          <Button variant="outline" size="xs" className="ml-auto">
            View <ArrowRight className="ml-2 size-3" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
