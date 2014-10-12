create table if not exists `ksa_mapdata` (
   `id` int(11) NOT NULL AUTO_INCREMENT,
   `name` varchar(150) NOT NULL,
   `header_en`varchar(150) NOT NULL,
   `content_da` text NOT NULL,
   `content_en` text NOT NULL,
   `geometry` text NOT NULL,
   `tags`char(250) NOT NULL,
   PRIMARY KEY(`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

