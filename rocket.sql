-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Tempo de geração: 26-Nov-2023 às 14:53
-- Versão do servidor: 10.4.27-MariaDB
-- versão do PHP: 8.1.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `rocket`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `apostas`
--

CREATE TABLE `apostas` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `rodada_id` int(11) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  `status` int(11) NOT NULL COMMENT '1=feita/2=finalizada/3=perdida',
  `odd` varchar(255) DEFAULT NULL,
  `ganho` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `rodada`
--

CREATE TABLE `rodada` (
  `id` int(11) NOT NULL,
  `token` varchar(255) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0=iniciando/1=iniciado/2=finalizado',
  `odd_crash` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `token` varchar(255) DEFAULT NULL,
  `expire_token` varchar(255) DEFAULT NULL,
  `balance` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `user`
--

INSERT INTO `user` (`id`, `username`, `password`, `token`, `expire_token`, `balance`) VALUES
(5, 'teste', '$2b$10$tkeq52UYEiRvk8JkCRB3QeDPTjm.rd2U8O.A.I3JCmOW7T2Jtbffq', 'u2JFB1vcHcA4acU8QvgkTJ005d6jMDK5S9Dxht5PV9nsWbdItCsGmNXYs18B', '1700970407011', '650.90');

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `apostas`
--
ALTER TABLE `apostas`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `rodada`
--
ALTER TABLE `rodada`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `apostas`
--
ALTER TABLE `apostas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=201;

--
-- AUTO_INCREMENT de tabela `rodada`
--
ALTER TABLE `rodada`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1220;

--
-- AUTO_INCREMENT de tabela `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
